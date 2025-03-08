const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Interface = sequelize.define('Interface', {
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
  interfaceIndex: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  macAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ipAddresses: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  operStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'unknown'
  },
  adminStatus: {
    type: DataTypes.STRING,
    allowNull: true
  },
  speed: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  mtu: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  inOctets: {
    type: DataTypes.BIGINT,
    allowNull: true,
    defaultValue: 0
  },
  outOctets: {
    type: DataTypes.BIGINT,
    allowNull: true,
    defaultValue: 0
  },
  inErrors: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  outErrors: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  lastUpdated: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['deviceId', 'interfaceIndex']
    },
    {
      fields: ['macAddress']
    }
  ]
});

module.exports = Interface;
