import Database from 'better-sqlite3';
import { resolve } from 'path';

// Open the database
const db = new Database(resolve(process.cwd(), 'data', 'peony_cafe.db'));

// Get all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

// For each table, check foreign keys
for (const table of tables) {
  console.log(`\nForeign keys for table ${table.name}:`);
  try {
    const foreignKeys = db.prepare(`PRAGMA foreign_key_list(${table.name})`).all();
    console.log(JSON.stringify(foreignKeys, null, 2));
  } catch (error) {
    console.error(`Error getting foreign keys for ${table.name}:`, error.message);
  }
}

// Close the database
db.close();
