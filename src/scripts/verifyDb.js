const { Client } = require('pg');

async function verifyDatabase() {
  const client = new Client({
    host: 'localhost',
    user: 'postgres',
    password: '123456',
    database: 'network_management'
  });

  try {
    await client.connect();
    
    // Check Users table
    const tableResult = await client.query(`
      SELECT * FROM "Users";
    `);
    
    console.log('Users in database:', tableResult.rows);
    
    await client.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyDatabase();
