/**
 * This script helps set up a local SQLite database for the Peony Cafe System.
 * No external database installation is required - SQLite is embedded and file-based.
 */
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'data', 'local.db');

function runQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getCount(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function run() {
  console.log('Setting up SQLite database for Peony Cafe System...');
  
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err);
      process.exit(1);
    }
  });

  try {
    // Create materials table with simplified schema
    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    console.log('Created materials table');

    // Check if table is empty
    const { count } = await getCount(db, 'SELECT COUNT(*) as count FROM materials');

    if (count === 0) {
      console.log('Inserting sample materials...');
      
      const now = new Date().toISOString();
      const sampleMaterials = [
        { name: 'قهوه اسپرسو', price: 80000 },
        { name: 'شیر', price: 15000 },
        { name: 'شکر', price: 5000 }
      ];

      // Insert sample materials
      for (const material of sampleMaterials) {
        await runQuery(
          db,
          'INSERT INTO materials (name, price, created_at, updated_at) VALUES (?, ?, ?, ?)',
          [material.name, material.price, now, now]
        );
        console.log(`Added material: ${material.name}`);
      }
    } else {
      console.log(`Materials table already contains ${count} records`);
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error during database setup:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

run().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 