const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TopologyLink = sequelize.define('TopologyLink', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sourceDeviceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Devices',
      key: 'id'
    }
  },
  targetDeviceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Devices',
      key: 'id'
    }
  },
  sourceInterfaceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Interfaces',
      key: 'id'
    }
  },
  targetInterfaceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Interfaces',
      key: 'id'
    }
  },
  linkType: {
    type: DataTypes.ENUM('physical', 'logical', 'wireless'),
    defaultValue: 'physical'
  },
  protocol: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('up', 'down'),
    defaultValue: 'down'
  },
  bandwidth: {
    type: DataTypes.BIGINT
  },
  latency: {
    type: DataTypes.INTEGER
  },
  lastSeen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  discoveryMethod: {
    type: DataTypes.ENUM('lldp', 'cdp', 'manual'),
    defaultValue: 'manual'
  },
  vlan: {
    type: DataTypes.INTEGER
  },
  encapsulation: {
    type: DataTypes.STRING
  }
});

module.exports = TopologyLink;
