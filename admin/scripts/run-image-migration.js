import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(process.cwd(), 'data', 'peony_cafe.db');
const MIGRATION_PATH = path.resolve(process.cwd(), 'migrations', 'add_image_url_to_recipes.sql');

async function runMigration() {
  console.log('Starting migration to add image_url column to recipes table...');

  // Check if database exists
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Database not found at path: ${DB_PATH}`);
    process.exit(1);
  }

  // Check if migration file exists
  if (!fs.existsSync(MIGRATION_PATH)) {
    console.error(`Migration file not found at path: ${MIGRATION_PATH}`);
    process.exit(1);
  }

  // Read migration SQL
  const migrationSQL = fs.readFileSync(MIGRATION_PATH, 'utf8');
  console.log('Migration SQL loaded:', migrationSQL);

  // Connect to database
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      process.exit(1);
    }
    console.log('Connected to database');
  });

  // Check if the column already exists
  db.all("PRAGMA table_info(recipes);", (err, rows) => {
    if (err) {
      console.error('Error getting table info:', err);
      db.close();
      process.exit(1);
    }

    // Parse the table info to see if image_url column exists
    const hasImageUrlColumn = rows && Array.isArray(rows) && rows.some(row => row.name === 'image_url');
    
    if (hasImageUrlColumn) {
      console.log('image_url column already exists in recipes table. Migration not needed.');
      db.close();
      return;
    }

    // Run the migration
    db.exec(migrationSQL, (err) => {
      if (err) {
        console.error('Error running migration:', err);
        db.close();
        process.exit(1);
      }
      
      console.log('Migration successful! Added image_url column to recipes table.');
      db.close();
    });
  });
}

// Run the migration
runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 