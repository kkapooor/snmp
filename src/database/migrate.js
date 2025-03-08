const { Client } = require('pg');
const sequelize = require('../config/database');
const User = require('../models/User');
const Device = require('../models/Device');
const DeviceMetric = require('../models/DeviceMetric');
const Interface = require('../models/Interface');
const DeviceConfig = require('../models/DeviceConfig');
const TopologyLink = require('../models/TopologyLink');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

async function createDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'postgres',
    ssl:{
      rejectUnauthorized:false
    }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server');
    
    const dbName = process.env.DB_NAME || 'network_management';

    // Check if database exists
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length === 0) {
      // Create database if it doesn't exist
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully`);
    } else {
      console.log(`Database ${dbName} already exists`);
      
      // Drop existing database and recreate it
      await client.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${dbName}'
        AND pid <> pg_backend_pid();
      `);
      await client.query(`DROP DATABASE IF EXISTS ${dbName}`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} dropped and recreated`);
    }
  } catch (error) {
    console.error('Error managing database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function migrate() {
  try {
    // Create database first
    await createDatabase();
    console.log('Database creation completed');

    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync all models with force:true to recreate tables
    await sequelize.sync({ force: true });
    console.log('Database tables recreated successfully.');

    // Create default admin user
    const adminUser = await User.create({
      username: 'admin',
      password: 'admin',
      email: 'admin@example.com',
      role: 'admin',
      isActive: true
    });

    console.log('Default admin user created successfully:');
    console.log('Username:', adminUser.username);
    console.log('Password (plain): admin');
    console.log('Password (hashed):', adminUser.getDataValue('password'));

    // Verify the password works
    const isMatch = await adminUser.comparePassword('admin');
    console.log('Password verification test:', isMatch ? 'PASSED' : 'FAILED');

    // Create sample device for testing
    const sampleDevice = await Device.create({
      name: 'Core-Switch-01',
      ipAddress: '192.168.1.1',
      type: 'Switch',
      model: 'Cisco Catalyst 9300',
      serialNumber: 'FOC1234X5YZ',
      snmpVersion: 'v2c',
      snmpCommunity: 'public',
      status: 'up',
      location: 'Main Data Center',
      description: 'Core switch for main campus',
      osType: 'IOS-XE',
      osVersion: '16.12.1',
      managementStatus: 'Managed'
    });

    // Create sample interface for the device
    await Interface.create({
      deviceId: sampleDevice.id,
      name: 'GigabitEthernet1/0/1',
      type: 'GigabitEthernet',
      speed: 1000000000,
      adminStatus: 'up',
      operStatus: 'up',
      description: 'Uplink to Distribution Switch',
      ipAddress: '192.168.1.2',
      macAddress: '00:11:22:33:44:55',
      mtu: 1500,
      duplex: 'full'
    });

    // Create sample metrics
    await DeviceMetric.create({
      deviceId: sampleDevice.id,
      metricType: 'CPU_UTILIZATION',
      value: 25.5,
      unit: '%',
      timestamp: new Date()
    });

    console.log('Sample device data created successfully.');

    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrate();
