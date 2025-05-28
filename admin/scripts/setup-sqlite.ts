import fs from 'fs';
import { resolve } from 'path';
import { sqlite, db } from '../server/db.sqlite';

async function main() {
  console.log('Setting up SQLite database for Peony Cafe System...');

  // Create tables
  console.log('Creating database tables...');
  
  try {
    // Materials table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'عمومی',
        price INTEGER NOT NULL,
        unit TEXT NOT NULL DEFAULT 'گرم',
        stock INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Recipes table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        price_coefficient NUMERIC NOT NULL DEFAULT 3.3,
        cost_price INTEGER NOT NULL DEFAULT 0,
        sell_price INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Recipe Ingredients table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER NOT NULL,
        material_id INTEGER NOT NULL,
        amount INTEGER NOT NULL CHECK (amount > 0),
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE RESTRICT,
        UNIQUE(recipe_id, material_id)
      )
    `);

    // Activities table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id INTEGER,
        entity_name TEXT,
        description TEXT NOT NULL,
        user_id INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
      )
    `);

    // Insert sample data
    console.log('Inserting sample data...');
    
    // Check if materials table is empty
    const materialsCount = await db.get('SELECT COUNT(*) as count FROM materials');
    console.log(`Materials table contains ${materialsCount.count} records`);

    if (materialsCount.count === 0) {
      console.log('Inserting sample materials...');
      
      const now = new Date().toISOString();
      const sampleMaterials = [
        {
          name: 'قهوه اسپرسو',
          price: 80000,
          unit: 'گرم',
          stock: 1000,
        },
        {
          name: 'شیر',
          price: 15000,
          unit: 'میلی‌لیتر',
          stock: 5000,
        },
        {
          name: 'شکر',
          price: 5000,
          unit: 'گرم',
          stock: 10000,
        },
      ];

      for (const material of sampleMaterials) {
        await db.run(
          `INSERT INTO materials (name, price, unit, stock, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            material.name,
            material.price,
            material.unit,
            material.stock,
            now,
            now,
          ]
        );
      }
    }
    
    console.log('SQLite database setup completed successfully!');
    console.log('You can now start the application with: npm run dev');
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(error => {
  console.error('Error setting up SQLite database:', error);
  process.exit(1);
}); 