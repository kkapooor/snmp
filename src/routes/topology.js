const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { Device, Interface, TopologyLink } = require('../models');

// Get network topology
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const links = await TopologyLink.findAll({
      include: [
        {
          model: Device,
          as: 'sourceDevice',
          attributes: ['id', 'hostname', 'ipAddress', 'deviceType', 'status']
        },
        {
          model: Device,
          as: 'targetDevice',
          attributes: ['id', 'hostname', 'ipAddress', 'deviceType', 'status']
        },
        {
          model: Interface,
          as: 'sourceInterface',
          attributes: ['id', 'name', 'type', 'status']
        },
        {
          model: Interface,
          as: 'targetInterface',
          attributes: ['id', 'name', 'type', 'status']
        }
      ]
    });

    res.json(links);
  } catch (error) {
    console.error('Error fetching topology:', error);
    res.status(500).json({ message: 'Error fetching topology' });
  }
});

// Add topology link (Admin only)
router.post('/links', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const link = await TopologyLink.create(req.body);
    res.status(201).json(link);
  } catch (error) {
    console.error('Error creating topology link:', error);
    res.status(500).json({ message: 'Error creating topology link' });
  }
});

// Update topology link (Admin only)
router.put('/links/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const link = await TopologyLink.findByPk(req.params.id);
    if (!link) {
      return res.status(404).json({ message: 'Topology link not found' });
    }
    await link.update(req.body);
    res.json(link);
  } catch (error) {
    console.error('Error updating topology link:', error);
    res.status(500).json({ message: 'Error updating topology link' });
  }
});

// Delete topology link (Admin only)
router.delete('/links/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const link = await TopologyLink.findByPk(req.params.id);
    if (!link) {
      return res.status(404).json({ message: 'Topology link not found' });
    }
    await link.destroy();
    res.json({ message: 'Topology link deleted successfully' });
  } catch (error) {
    console.error('Error deleting topology link:', error);
    res.status(500).json({ message: 'Error deleting topology link' });
  }
});

// Discover network topology (Admin only)
router.post('/discover', isAuthenticated, isAdmin, async (req, res) => {
  try {
    // TODO: Implement CDP/LLDP discovery logic
    res.json({ message: 'Topology discovery initiated' });
  } catch (error) {
    console.error('Error discovering topology:', error);
    res.status(500).json({ message: 'Error discovering topology' });
  }
});

module.exports = router;
