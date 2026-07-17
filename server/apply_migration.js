const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to DB");
    const sql = fs.readFileSync(path.join(__dirname, '../client_portal_migration.sql'), 'utf8');
    await client.query(sql);
    console.log("Successfully applied client_portal_migration.sql");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
