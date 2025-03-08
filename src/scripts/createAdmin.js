const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  const client = new Client({
    host: 'localhost',
    user: 'postgres',
    password: '123456',
    database: 'postgres'
  });

  try {
    await client.connect();
    
    // Drop database if exists
    await client.query(`
      DROP DATABASE IF EXISTS network_management;
    `);
    console.log('Dropped existing database');

    // Create new database
    await client.query(`
      CREATE DATABASE network_management;
    `);
    console.log('Created new database');

    await client.end();

    // Connect to the new database
    const newClient = new Client({
      host: 'localhost',
      user: 'postgres',
      password: '123456',
      database: 'network_management'
    });

    await newClient.connect();

    // Create users table
    await newClient.query(`
      CREATE TABLE IF NOT EXISTS "Users" (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);
    console.log('Created Users table');

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    const now = new Date().toISOString();

    await newClient.query(`
      INSERT INTO "Users" (username, password, email, role, "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, ['admin', hashedPassword, 'admin@example.com', 'admin', true, now, now]);

    console.log('Created admin user');
    await newClient.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setupDatabase();
