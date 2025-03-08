const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isAuthenticated = async (req, res, next) => {
  try {
    // Check for token in cookie first, then header
    let token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findByPk(decoded.id); // Changed from userId to id to match token payload

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    req.user = {
      id: decoded.id,           // Changed from userId to id
      username: decoded.username,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    // Clear invalid token if present
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.status(401).json({ message: 'Please authenticate' });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    console.error('Admin authorization error:', error.message);
    res.status(403).json({ message: 'Admin access required' });
  }
};

module.exports = {
  isAuthenticated,
  isAdmin
};
