import Database from 'better-sqlite3';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

// Paths
const dbPath = resolve(process.cwd(), 'data', 'peony_cafe.db');
const backupPath = resolve(process.cwd(), 'data', `peony_cafe_backup_${Date.now()}.db`);

// Create backup
console.log(`Creating backup at ${backupPath}`);
fs.copyFileSync(dbPath, backupPath);
console.log('Backup created successfully');

// Open the database
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Begin transaction
db.prepare('BEGIN TRANSACTION').run();

try {
  console.log('Checking if drizzle_schema table exists...');
  const drizzleSchemaExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations'").get();
  
  if (drizzleSchemaExists) {
    console.log('Removing drizzle migrations table to force schema refresh');
    db.prepare('DROP TABLE IF EXISTS __drizzle_migrations').run();
  }
  
  // Commit transaction
  db.prepare('COMMIT').run();
  console.log('Schema fix completed successfully');
} catch (error) {
  // Rollback on error
  db.prepare('ROLLBACK').run();
  console.error('Error fixing schema:', error);
}

// Close the database
db.close();
