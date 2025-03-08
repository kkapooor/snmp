const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeviceConfig = sequelize.define('DeviceConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  deviceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Devices',
      key: 'id'
    }
  },
  configType: {
    type: DataTypes.ENUM('running', 'startup', 'backup'),
    defaultValue: 'running'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  changeType: {
    type: DataTypes.ENUM('initial', 'scheduled', 'manual', 'automatic'),
    defaultValue: 'manual'
  },
  changedBy: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('active', 'archived', 'rollback'),
    defaultValue: 'active'
  },
  complianceStatus: {
    type: DataTypes.ENUM('compliant', 'non-compliant', 'unknown'),
    defaultValue: 'unknown'
  },
  backupStatus: {
    type: DataTypes.ENUM('success', 'failed', 'in-progress'),
    defaultValue: 'in-progress'
  }
});

module.exports = DeviceConfig;
