const express = require('express');
const { Device } = require('../models');
const router = express.Router();

// Get all devices
router.get('/', async (req, res) => {
  try {
    const devices = await Device.findAll();
    res.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get device summary
router.get('/summary', async (req, res) => {
  try {
    const devices = await Device.findAll();
    const summary = {
      totalDevices: devices.length,
      activeDevices: devices.filter(d => d.status === 'up').length,
      inactiveDevices: devices.filter(d => d.status !== 'up').length
    };
    res.json(summary);
  } catch (error) {
    console.error('Error fetching device summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single device
router.get('/:id', async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    res.json(device);
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create device
router.post('/', async (req, res) => {
  try {
    const device = await Device.create(req.body);
    res.status(201).json(device);
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update device
router.put('/:id', async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    await device.update(req.body);
    res.json(device);
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete device
router.delete('/:id', async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    await device.destroy();
    res.json({ message: 'Device deleted' });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
