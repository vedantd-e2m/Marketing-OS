const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

async function runMigration() {
  const connectionString = process.env.DATABASE_URL.trim();
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('Connected to DB');
    const sql = fs.readFileSync('../client_portal_migration.sql', 'utf8');
    await client.query(sql);
    console.log('Migration executed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();
