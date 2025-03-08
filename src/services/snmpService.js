const snmp = require('net-snmp');
const { Device, DeviceMetric, Interface } = require('../models');

// SNMP OIDs for common metrics
const OIDs = {
  // System Information
  sysDescr: '1.3.6.1.2.1.1.1.0',
  sysUpTime: '1.3.6.1.2.1.1.3.0',
  sysName: '1.3.6.1.2.1.1.5.0',
  
  // IP and MAC Address Information
  ipAddrTable: '1.3.6.1.2.1.4.20.1',          // IP Address table
  ipAdEntAddr: '1.3.6.1.2.1.4.20.1.1',        // IP addresses
  ipAdEntIfIndex: '1.3.6.1.2.1.4.20.1.2',     // Interface index for each IP
  ipAdEntNetMask: '1.3.6.1.2.1.4.20.1.3',     // Subnet mask
  
  // Interface Information
  ifTable: '1.3.6.1.2.1.2.2',                 // Interface table
  ifPhysAddress: '1.3.6.1.2.1.2.2.1.6',       // MAC addresses
  ifDescr: '1.3.6.1.2.1.2.2.1.2',             // Interface descriptions
  ifType: '1.3.6.1.2.1.2.2.1.3',              // Interface types
  ifMtu: '1.3.6.1.2.1.2.2.1.4',               // Interface MTU
  ifSpeed: '1.3.6.1.2.1.2.2.1.5',             // Interface speed
  ifOperStatus: '1.3.6.1.2.1.2.2.1.8',        // Interface operational status
  ifInOctets: '1.3.6.1.2.1.2.2.1.10',         // Input octets
  ifOutOctets: '1.3.6.1.2.1.2.2.1.16',        // Output octets
  ifInErrors: '1.3.6.1.2.1.2.2.1.14',         // Input errors
  ifOutErrors: '1.3.6.1.2.1.2.2.1.20',        // Output errors

  // ARP Table for MAC-IP mapping
  ipNetToMediaTable: '1.3.6.1.2.1.4.22.1',    // ARP table
  ipNetToMediaPhysAddress: '1.3.6.1.2.1.4.22.1.2', // MAC addresses from ARP
  ipNetToMediaNetAddress: '1.3.6.1.2.1.4.22.1.3',  // IP addresses from ARP

  // Performance Metrics
  cpuLoad: '1.3.6.1.4.1.9.9.109.1.1.1.1.5.1', // Cisco CPU Load
  memoryUsed: '1.3.6.1.4.1.9.9.48.1.1.1.5.1', // Cisco Memory Used
  memoryFree: '1.3.6.1.4.1.9.9.48.1.1.1.6.1', // Cisco Memory Free
  temperature: '1.3.6.1.4.1.9.9.13.1.3.1.3.1', // Cisco Temperature
};

class SNMPService {
  constructor() {
    this.sessions = new Map();
  }

  createSession(device) {
    let options = {
      port: 161,
      retries: 1,
      timeout: 5000,
      transport: "udp4",
      trapPort: 162,
      version: snmp.Version2c
    };

    if (device.snmpVersion === 'v3') {
      options = {
        ...options,
        version: snmp.Version3,
        engineID: "8000B98380XXXXXXXXXXXXXXXX", // Add your engine ID
        contextName: "",
        securityName: device.snmpUsername,
        authProtocol: device.snmpAuthProtocol === 'SHA' ? snmp.AuthProtocols.sha : snmp.AuthProtocols.md5,
        authKey: device.snmpAuthKey,
        privProtocol: device.snmpPrivProtocol === 'AES' ? snmp.PrivProtocols.aes : snmp.PrivProtocols.des,
        privKey: device.snmpPrivKey
      };
    } else {
      options.community = device.snmpCommunity;
    }

    return snmp.createSession(device.ipAddress, options);
  }

  async monitorDevice(device) {
    try {
      const session = this.createSession(device);
      this.sessions.set(device.id, session);

      // Get basic system info
      const systemInfo = await this.getSystemInfo(session);
      
      // Get performance metrics
      const metrics = await this.getPerformanceMetrics(session);
      
      // Get interface metrics
      const interfaces = await this.getInterfaceAddresses(session);

      // Update device and save metrics
      await this.updateDeviceAndMetrics(device, systemInfo, metrics, interfaces);

      return true;
    } catch (error) {
      console.error(`Error monitoring device ${device.hostname}:`, error);
      return false;
    }
  }

  getSystemInfo(session) {
    return new Promise((resolve, reject) => {
      const oids = [OIDs.sysDescr, OIDs.sysUpTime, OIDs.sysName];
      
      session.get(oids, (error, varbinds) => {
        if (error) {
          reject(error);
        } else {
          const info = {
            description: varbinds[0]?.value?.toString(),
            uptime: varbinds[1]?.value,
            hostname: varbinds[2]?.value?.toString()
          };
          resolve(info);
        }
      });
    });
  }

  getPerformanceMetrics(session) {
    return new Promise((resolve, reject) => {
      const oids = [OIDs.cpuLoad, OIDs.memoryUsed, OIDs.memoryFree, OIDs.temperature];
      
      session.get(oids, (error, varbinds) => {
        if (error) {
          reject(error);
        } else {
          const metrics = {
            cpuUtilization: varbinds[0]?.value,
            memoryUsed: varbinds[1]?.value,
            memoryFree: varbinds[2]?.value,
            temperature: varbinds[3]?.value
          };
          resolve(metrics);
        }
      });
    });
  }

  async getInterfaceAddresses(session) {
    try {
      // Get interface information including MAC addresses
      const interfaces = await new Promise((resolve, reject) => {
        session.tableColumns([
          OIDs.ifDescr,
          OIDs.ifPhysAddress,
          OIDs.ifType,
          OIDs.ifOperStatus,
          OIDs.ifSpeed,
          OIDs.ifMtu
        ], (error, table) => {
          if (error) {
            reject(error);
          } else {
            const interfaces = Object.entries(table).map(([index, row]) => ({
              index: parseInt(index),
              description: row[0]?.toString(),
              macAddress: this.formatMacAddress(row[1]),
              type: row[2],
              operStatus: row[3] === 1 ? 'up' : 'down',
              speed: row[4],
              mtu: row[5]
            }));
            resolve(interfaces);
          }
        });
      });

      // Get IP addresses and subnet masks
      const ipAddresses = await new Promise((resolve, reject) => {
        session.tableColumns([
          OIDs.ipAdEntAddr,
          OIDs.ipAdEntIfIndex,
          OIDs.ipAdEntNetMask
        ], (error, table) => {
          if (error) {
            reject(error);
          } else {
            const addresses = Object.entries(table).map(([_, row]) => ({
              ipAddress: row[0]?.toString(),
              interfaceIndex: row[1],
              subnetMask: row[2]?.toString()
            }));
            resolve(addresses);
          }
        });
      });

      // Get ARP table for MAC-IP mapping
      const arpEntries = await new Promise((resolve, reject) => {
        session.tableColumns([
          OIDs.ipNetToMediaPhysAddress,
          OIDs.ipNetToMediaNetAddress
        ], (error, table) => {
          if (error) {
            reject(error);
          } else {
            const entries = Object.entries(table).map(([_, row]) => ({
              macAddress: this.formatMacAddress(row[0]),
              ipAddress: row[1]?.toString()
            }));
            resolve(entries);
          }
        });
      });

      // Combine interface, IP, and ARP information
      const fullInterfaces = interfaces.map(iface => {
        const ipInfo = ipAddresses.filter(ip => ip.interfaceIndex === iface.index);
        const arpInfo = arpEntries.filter(arp => 
          arp.macAddress === iface.macAddress || 
          ipInfo.some(ip => ip.ipAddress === arp.ipAddress)
        );

        return {
          ...iface,
          ipAddresses: ipInfo.map(ip => ({
            address: ip.ipAddress,
            subnetMask: ip.subnetMask
          })),
          arpEntries: arpInfo
        };
      });

      return fullInterfaces;
    } catch (error) {
      console.error('Error getting interface addresses:', error);
      return [];
    }
  }

  formatMacAddress(buffer) {
    if (!buffer || !buffer.length) return '';
    
    return Array.from(buffer)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join(':')
      .toUpperCase();
  }

  async updateDeviceAndMetrics(device, systemInfo, metrics, interfaces) {
    // Update device info
    await device.update({
      hostname: systemInfo.hostname || device.hostname,
      uptime: systemInfo.uptime,
      status: 'up',
      lastSeen: new Date(),
      cpuUtilization: metrics.cpuUtilization,
      memoryUtilization: metrics.memoryUsed / (metrics.memoryUsed + metrics.memoryFree) * 100,
      reachabilityStatus: 'reachable'
    });

    // Save metrics
    await DeviceMetric.create({
      deviceId: device.id,
      cpuUtilization: metrics.cpuUtilization,
      memoryUtilization: metrics.memoryUsed / (metrics.memoryUsed + metrics.memoryFree) * 100,
      temperature: metrics.temperature,
      freeMemory: metrics.memoryFree,
      totalMemory: metrics.memoryUsed + metrics.memoryFree
    });

    // Update interface information
    for (const ifInfo of interfaces) {
      const networkInterface = await Interface.findOne({
        where: { deviceId: device.id, interfaceIndex: ifInfo.index }
      });

      const interfaceData = {
        deviceId: device.id,
        interfaceIndex: ifInfo.index,
        name: ifInfo.description,
        type: ifInfo.type,
        macAddress: ifInfo.macAddress,
        operStatus: ifInfo.operStatus,
        speed: ifInfo.speed,
        mtu: ifInfo.mtu,
        ipAddresses: ifInfo.ipAddresses,
        lastUpdated: new Date()
      };

      if (networkInterface) {
        await networkInterface.update(interfaceData);
      } else {
        await Interface.create(interfaceData);
      }
    }
  }

  async startMonitoring(deviceId, interval = 300000) { // Default 5 minutes
    try {
      const device = await Device.findByPk(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      // Stop any existing monitoring
      this.stopMonitoring(deviceId);

      // Start new monitoring interval
      const intervalId = setInterval(async () => {
        await this.monitorDevice(device);
      }, interval);

      // Store interval ID
      this.sessions.set(`${deviceId}_interval`, intervalId);

      // Do initial monitoring
      await this.monitorDevice(device);

      return true;
    } catch (error) {
      console.error(`Error starting monitoring for device ${deviceId}:`, error);
      return false;
    }
  }

  stopMonitoring(deviceId) {
    // Clear monitoring interval
    const intervalId = this.sessions.get(`${deviceId}_interval`);
    if (intervalId) {
      clearInterval(intervalId);
      this.sessions.delete(`${deviceId}_interval`);
    }

    // Close SNMP session
    const session = this.sessions.get(deviceId);
    if (session) {
      session.close();
      this.sessions.delete(deviceId);
    }
  }
}

module.exports = new SNMPService();
