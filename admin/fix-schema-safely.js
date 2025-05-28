import Database from 'better-sqlite3';
import { resolve } from 'path';
import fs from 'fs';

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
db.pragma('foreign_keys = OFF');

// Begin transaction
db.prepare('BEGIN TRANSACTION').run();

try {
  // Create a temporary table for materials
  console.log('Creating temporary materials table...');
  db.prepare(`
    CREATE TABLE materials_temp (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'عمومی',
      price INTEGER NOT NULL,
      unit TEXT NOT NULL DEFAULT 'گرم',
      stock INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();

  // Copy data from materials to temp table
  console.log('Copying materials data...');
  db.prepare(`
    INSERT INTO materials_temp 
    SELECT id, name, category, price, unit, stock, created_at, updated_at 
    FROM materials
  `).run();

  // Drop original materials table
  console.log('Dropping original materials table...');
  db.prepare('DROP TABLE materials').run();

  // Rename temp table to materials
  console.log('Renaming temporary materials table...');
  db.prepare('ALTER TABLE materials_temp RENAME TO materials').run();

  // Create a temporary table for activities
  console.log('Creating temporary activities table...');
  db.prepare(`
    CREATE TABLE activities_temp (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id INTEGER,
      entity_name TEXT,
      description TEXT NOT NULL,
      user_id INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    )
  `).run();

  // Copy data from activities to temp table
  console.log('Copying activities data...');
  db.prepare(`
    INSERT INTO activities_temp 
    SELECT id, type, entity, entity_id, entity_name, description, user_id, created_at 
    FROM activities
  `).run();

  // Drop original activities table
  console.log('Dropping original activities table...');
  db.prepare('DROP TABLE activities').run();

  // Rename temp table to activities
  console.log('Renaming temporary activities table...');
  db.prepare('ALTER TABLE activities_temp RENAME TO activities').run();

  // Recreate foreign key constraints for recipe_ingredients
  console.log('Recreating foreign key constraints...');
  db.prepare(`
    CREATE TABLE recipe_ingredients_temp (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE RESTRICT,
      UNIQUE(recipe_id, material_id)
    )
  `).run();

  // Copy data from recipe_ingredients to temp table
  console.log('Copying recipe_ingredients data...');
  db.prepare(`
    INSERT INTO recipe_ingredients_temp 
    SELECT id, recipe_id, material_id, amount 
    FROM recipe_ingredients
  `).run();

  // Drop original recipe_ingredients table
  console.log('Dropping original recipe_ingredients table...');
  db.prepare('DROP TABLE recipe_ingredients').run();

  // Rename temp table to recipe_ingredients
  console.log('Renaming temporary recipe_ingredients table...');
  db.prepare('ALTER TABLE recipe_ingredients_temp RENAME TO recipe_ingredients').run();

  // Commit transaction
  db.prepare('COMMIT').run();
  console.log('Schema fix completed successfully');
} catch (error) {
  // Rollback on error
  db.prepare('ROLLBACK').run();
  console.error('Error fixing schema:', error);
}

// Re-enable foreign keys
db.pragma('foreign_keys = ON');

// Close the database
db.close();
