const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Device = sequelize.define('Device', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: false
  },
  community: {
    type: DataTypes.STRING,
    allowNull: false
  },
  version: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '2c'
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 161
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'unknown'
  },
  lastChecked: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Device;
