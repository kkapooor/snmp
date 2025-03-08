const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
  const client = new Client({
    host: 'localhost',
    user: 'postgres',
    password: '123456',
    database: 'network_management'
  });

  try {
    await client.connect();
    
    // Generate new password hash
    const salt = await bcrypt.genSalt(10);
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update admin user
    const now = new Date().toISOString();
    await client.query(`
      UPDATE "Users"
      SET password = $1, "updatedAt" = $2
      WHERE username = 'admin'
    `, [hashedPassword, now]);
    
    // Verify the update
    const result = await client.query('SELECT * FROM "Users" WHERE username = $1', ['admin']);
    console.log('Updated admin user:', result.rows[0]);
    
    await client.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

resetAdmin();
