const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { Device, Interface, DeviceMetric, DeviceConfig } = require('../models');
const snmpService = require('../services/snmpService');

// Get all devices with basic info
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const devices = await Device.findAll({
      attributes: ['id', 'hostname', 'ipAddress', 'deviceType', 'status', 'lastSeen', 'reachabilityStatus']
    });
    res.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ message: 'Error fetching devices' });
  }
});

// Get detailed device information
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id, {
      include: [
        { model: Interface, as: 'interfaces' },
        { 
          model: DeviceMetric, 
          as: 'metrics',
          limit: 1,
          order: [['timestamp', 'DESC']]
        }
      ]
    });
    
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    res.json(device);
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ message: 'Error fetching device details' });
  }
});

// Add a new device (Admin only)
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const device = await Device.create(req.body);
    
    // Start monitoring if SNMP credentials are provided
    if (device.snmpVersion && (device.snmpCommunity || (device.snmpUsername && device.snmpAuthKey))) {
      await snmpService.startMonitoring(device.id);
    }
    
    res.status(201).json(device);
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({ message: 'Error creating device' });
  }
});

// Update device (Admin only)
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    await device.update(req.body);
    
    // Update monitoring if SNMP credentials changed
    if (req.body.snmpVersion || req.body.snmpCommunity || req.body.snmpUsername || req.body.snmpAuthKey) {
      await snmpService.stopMonitoring(device.id);
      if (device.snmpVersion && (device.snmpCommunity || (device.snmpUsername && device.snmpAuthKey))) {
        await snmpService.startMonitoring(device.id);
      }
    }
    
    res.json(device);
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ message: 'Error updating device' });
  }
});

// Delete device (Admin only)
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    // Stop monitoring before deleting
    snmpService.stopMonitoring(device.id);
    
    await device.destroy();
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ message: 'Error deleting device' });
  }
});

// Get device metrics history
router.get('/:id/metrics', isAuthenticated, async (req, res) => {
  try {
    const metrics = await DeviceMetric.findAll({
      where: { deviceId: req.params.id },
      order: [['timestamp', 'DESC']],
      limit: parseInt(req.query.limit) || 100
    });
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching device metrics:', error);
    res.status(500).json({ message: 'Error fetching device metrics' });
  }
});

// Start monitoring device (Admin only)
router.post('/:id/monitor', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const interval = req.body.interval || 300000; // Default 5 minutes
    const success = await snmpService.startMonitoring(device.id, interval);

    if (success) {
      res.json({ message: 'Device monitoring started' });
    } else {
      res.status(500).json({ message: 'Failed to start device monitoring' });
    }
  } catch (error) {
    console.error('Error starting device monitoring:', error);
    res.status(500).json({ message: 'Error starting device monitoring' });
  }
});

// Stop monitoring device (Admin only)
router.post('/:id/stop-monitor', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    snmpService.stopMonitoring(device.id);
    res.json({ message: 'Device monitoring stopped' });
  } catch (error) {
    console.error('Error stopping device monitoring:', error);
    res.status(500).json({ message: 'Error stopping device monitoring' });
  }
});

// Get device configuration history
router.get('/:id/configs', isAuthenticated, async (req, res) => {
  try {
    const configs = await DeviceConfig.findAll({
      where: { deviceId: req.params.id },
      order: [['timestamp', 'DESC']],
      attributes: ['id', 'configType', 'version', 'timestamp', 'changedBy', 'status']
    });
    res.json(configs);
  } catch (error) {
    console.error('Error fetching device configurations:', error);
    res.status(500).json({ message: 'Error fetching device configurations' });
  }
});

// Get specific device configuration
router.get('/:deviceId/configs/:configId', isAuthenticated, async (req, res) => {
  try {
    const config = await DeviceConfig.findOne({
      where: { 
        deviceId: req.params.deviceId,
        id: req.params.configId
      }
    });
    
    if (!config) {
      return res.status(404).json({ message: 'Configuration not found' });
    }
    
    res.json(config);
  } catch (error) {
    console.error('Error fetching device configuration:', error);
    res.status(500).json({ message: 'Error fetching device configuration' });
  }
});

module.exports = router;
