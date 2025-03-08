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
    
    // ssl:{
    //   ca:`-----BEGIN CERTIFICATE-----
    //   MIIETTCCArWgAwIBAgIUe+SBUsI7qHmich+GTnx5MOQaMQQwDQYJKoZIhvcNAQEM
    //   BQAwQDE+MDwGA1UEAww1MjZmNDFhZGUtOTE4Zi00NTg1LThhYTAtNTk1ZDlhMTcy
    //   YzU2IEdFTiAxIFByb2plY3QgQ0EwHhcNMjUwMzAzMTEyMTAxWhcNMzUwMzAxMTEy
    //   MTAxWjBAMT4wPAYDVQQDDDUyNmY0MWFkZS05MThmLTQ1ODUtOGFhMC01OTVkOWEx
    //   NzJjNTYgR0VOIDEgUHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCC
    //   AYoCggGBAKsXBLFPdYxDmAEk3tV8+AwREQYOBJ9aVDO7Tbtjrg53+5fRJcSLFYaB
    //   8Lcb2Z1ltFzwTa/3RnGZa9L3fD4zWYhoaced1F1clVsWTZR3guSjPB7bJcwKJEzM
    //   yz3lIMXTeM+zAJ3hWRc5xTQqC0Fs0zkt3yNi6MrbpZ+SjmX+ZJwEA2Exx03VY86X
    //   3AV29liB18e+WynYji8tHA/JtujKFBExMMU4VaFpTBjC0OVtAYRkSOtwVE3uE4Xs
    //   9K85cqiKmJRdgtdmequEIyN7QkSPx0J9VtvMbLkaxj0L0hdXR6Ic3r6MmEj+sjKQ
    //   P0XirzuCdecojf0Cev7DrG5ps89BCqo84f+Im1CpICCVedAu6ZZM2yG8kd8XSb62
    //   ZtAqhjJs/I9/Eex/AVU7+/EUabKkEOccvb1spXbOGhPSYalHQuTJSja5k3NuibcV
    //   h63DrBTY8WClZb4A0GPGJ94dXFK72vjDqAl2B8SoZVR0yZi2GZtbP0hn52XLpY6t
    //   EeQUTqrqwQIDAQABoz8wPTAdBgNVHQ4EFgQUJFMvYlWR5zlayYl6ck5sfFeR7GMw
    //   DwYDVR0TBAgwBgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQADggGB
    //   AKMBx6w5IbElwGbggH8n4pywicpCKqwAd2U0pX3F0ThIoYxRoMzQxdp+WsNkNlCN
    //   IGcaH4w4jC64DLuJUJ9lDT5UGwTSg8iBR5I/TLbFk61kdaQlpdgm1ctoHgMWEV7x
    //   ncn2Y1a7uFz1uDILhDZvZCpsW/L7ZD+2xhvHDbEyLbfiYJarpu2vBsibSZ1HCnnr
    //   g4JMuizU/1P7cvd9iShOyQ/+A9X85gZDiRQ4DhqtGr5h88+TF5dR07Vl8G2witmI
    //   YklXsPCe3Y9n/hqU3WrMVMUP4ZBJWUhIGh3zSIgUK8kHtVoECPdAmtPbSTzOhekt
    //   EiEGOVQmBpIJPwwO6l/CSdru0mya5AW31Gy59kN4jsjmCBHpvBsAA/xAJgME3Z5B
    //   3W9ZoeTONKz81WEaTNcFsVuyL63m/cg5i+d9qTAkaZqZHbjQNy95ZaprxFIk2tPb
    //   nfohDqSL1g44lYq7ItlLQq1wO9yvyxk8H9GJfYyiLzRy4vgD/szV8vpOfu19c0ry
    //   sg==
    //   -----END CERTIFICATE-----`
    // },
    // logging: process.env.NODE_ENV === 'development' ? console.log : false,
    // define: {
    //   timestamps: true
    // },
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
