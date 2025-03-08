const Device = require('./Device');
const Interface = require('./Interface');
const User = require('./User');

// Define associations
Device.hasMany(Interface, {
  foreignKey: 'deviceId',
  as: 'interfaces',
  onDelete: 'CASCADE'
});

Interface.belongsTo(Device, {
  foreignKey: 'deviceId',
  as: 'device'
});

module.exports = {
  Device,
  Interface,
  User
};
