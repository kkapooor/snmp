const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const sequelize = new Sequelize(
  {
    database:process.env.DB_NAME,
    username:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    dialectOptions:{
      ssl:{
        require:false,
        rejectUnauthorized: false
      }
    },
    logging:false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Initialize database and create default admin if needed
const initializeDatabase = async () => {
  try {
    // First test the connection
    await sequelize.authenticate();
    console.log('Database connection test successful');

    // Only force sync in development
    const syncOptions = process.env.NODE_ENV === 'development' ? { alter: true } : {};
    
    // Drop the existing enum type if it exists (only in development)
    if (process.env.NODE_ENV === 'development') {
      try {
        await sequelize.query('DROP TYPE IF EXISTS "enum_Users_role" CASCADE;');
      } catch (error) {
        console.log('No enum type to drop');
      }
    }

    // Sync database
    await sequelize.sync(syncOptions);
    console.log('Database synchronized');
    
    // Create default admin user if it doesn't exist
    const { User } = require('../models');
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const password = "admin123";
      const hashedPassword = await bcrypt.hash(password, salt);
      
      await User.create({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@example.com',
        role: 'admin',
        isActive: true
      });
      
      console.log('Default admin user created');
    }else{
      console.log('Admin user already present')
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Initialize database on startup
initializeDatabase();

module.exports = sequelize;
