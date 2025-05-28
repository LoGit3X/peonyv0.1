import sqlite3 from 'sqlite3';
import { resolve } from 'path';

// Enable verbose mode for more detailed error messages
sqlite3.verbose();

// Database paths
const MAIN_DB_PATH = resolve(process.cwd(), 'data', 'peony_cafe.db');
const TEST_DB_PATH = resolve(process.cwd(), 'test', 'test.db');

// Create database connections
const mainDb = new sqlite3.Database(MAIN_DB_PATH);
const testDb = new sqlite3.Database(TEST_DB_PATH);

async function query(db: sqlite3.Database, sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('SQL Error:', err.message);
        console.error('SQL Query:', sql);
        console.error('SQL Params:', JSON.stringify(params));
        return reject(err);
      }
      resolve(rows);
    });
  });
}

async function run(db: sqlite3.Database, sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('SQL Error:', err.message);
        console.error('SQL Query:', sql);
        console.error('SQL Params:', JSON.stringify(params));
        return reject(err);
      }
      resolve(this);
    });
  });
}

async function main() {
  try {
    console.log('Starting recipes migration...');

    // Clear existing recipes from main database
    console.log('Clearing existing recipes...');
    await run(mainDb, 'DELETE FROM recipe_ingredients');
    await run(mainDb, 'DELETE FROM recipes');
    await run(mainDb, 'DELETE FROM sqlite_sequence WHERE name = "recipes"');
    await run(mainDb, 'DELETE FROM sqlite_sequence WHERE name = "recipe_ingredients"');

    // Get recipes from test database
    console.log('Reading recipes from test database...');
    const recipes = await query(testDb, `
      SELECT r.name, c.name as category, r.id
      FROM recipes r
      JOIN categories c ON r.category_id = c.id
    `);
    console.log(`Found ${recipes.length} recipes in test database`);

    // Insert recipes into main database
    console.log('Inserting recipes into main database...');
    const now = new Date().toISOString();
    
    for (const recipe of recipes) {
      console.log(`\nProcessing recipe: ${recipe.name}`);
      
      // Get recipe details
      const details = await query(testDb, `
        SELECT rd.quantity, m.name as material_name
        FROM recipe_details rd
        JOIN materials m ON rd.material_id = m.id
        WHERE rd.recipe_id = ?
      `, [recipe.id]);

      // Insert recipe
      const recipeResult = await run(
        mainDb,
        `INSERT INTO recipes (name, category, price_coefficient, cost_price, sell_price, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          recipe.name,
          recipe.category || 'نوشیدنی',
          3.3, // Default price coefficient
          0, // Will be calculated later
          0, // Will be calculated later
          now,
          now
        ]
      );
      
      // Insert recipe ingredients
      for (const detail of details) {
        // Get material id from main database
        const material = await query(mainDb, 'SELECT id FROM materials WHERE name = ?', [detail.material_name]);
        if (material.length > 0) {
          if (detail.quantity > 0) {
            await run(
              mainDb,
              `INSERT INTO recipe_ingredients (recipe_id, material_id, amount)
               VALUES (?, ?, ?)`,
              [recipeResult.lastID, material[0].id, detail.quantity]
            );
            console.log(`  Added ingredient: ${detail.material_name} (${detail.quantity}g)`);
          } else {
            console.warn(`  Warning: Invalid quantity "${detail.quantity}" for material "${detail.material_name}"`);
          }
        } else {
          console.warn(`  Warning: Material "${detail.material_name}" not found in main database`);
        }
      }
    }

    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Close database connections
    mainDb.close();
    testDb.close();
  }
}

main().catch(error => {
  console.error('Error in migration script:', error);
  process.exit(1);
}); 