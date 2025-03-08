const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeviceMetric = sequelize.define('DeviceMetric', {
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
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  cpuUtilization: {
    type: DataTypes.FLOAT
  },
  memoryUtilization: {
    type: DataTypes.FLOAT
  },
  temperature: {
    type: DataTypes.FLOAT
  },
  freeMemory: {
    type: DataTypes.BIGINT
  },
  totalMemory: {
    type: DataTypes.BIGINT
  },
  diskUtilization: {
    type: DataTypes.FLOAT
  },
  freeDisk: {
    type: DataTypes.BIGINT
  },
  totalDisk: {
    type: DataTypes.BIGINT
  },
  responseTime: {
    type: DataTypes.INTEGER
  },
  packetLoss: {
    type: DataTypes.FLOAT
  },
  bgpNeighbors: {
    type: DataTypes.INTEGER
  },
  bgpState: {
    type: DataTypes.STRING
  },
  ospfNeighbors: {
    type: DataTypes.INTEGER
  },
  ospfState: {
    type: DataTypes.STRING
  }
});

module.exports = DeviceMetric;
