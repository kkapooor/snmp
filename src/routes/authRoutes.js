const express = require('express');
const { User } = require('../models');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
      // Use the static authenticate method
      const user = await User.authenticate(username, password);
      const token = user.generateToken();

      // Set token in cookie for better security
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email,
          lastLogin: user.lastLogin
        }
      });
    } catch (authError) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'An error occurred during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Logout endpoint
router.post('/logout', isAuthenticated, (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'An error occurred during logout' });
  }
});

// Check auth status endpoint
router.get('/status', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'role', 'email', 'lastLogin', 'isActive']
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        isAuthenticated: false,
        message: 'User not found or inactive'
      });
    }

    res.json({ 
      isAuthenticated: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      message: 'An error occurred while checking authentication status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
