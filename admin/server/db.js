import { resolve } from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';

// Enable verbose mode for more detailed error messages
sqlite3.verbose();

// Ensure data directory exists
const DATA_DIR = resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`Created data directory at: ${DATA_DIR}`);
}

// Create SQLite database connection
const DB_PATH = resolve(DATA_DIR, 'peony_cafe.db');
console.log(`Attempting to connect to SQLite database at: ${DB_PATH}`);

// Open the database with explicit error callback
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    throw err;
  }
  console.log(`Successfully connected to SQLite database at: ${DB_PATH}`);
  
  // Check if we can access the materials table
  db.get("SELECT count(*) as count FROM materials", [], (err, row) => {
    if (err) {
      console.error('Error accessing materials table:', err.message);
    } else {
      console.log(`Materials table contains ${row.count} records`);
    }
  });
});

export default db; 