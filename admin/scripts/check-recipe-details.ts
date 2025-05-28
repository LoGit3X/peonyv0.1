import sqlite3 from 'sqlite3';
import { resolve } from 'path';

// Enable verbose mode for more detailed error messages
sqlite3.verbose();

// Database path
const TEST_DB_PATH = resolve(process.cwd(), 'test', 'test.db');

// Create database connection
const db = new sqlite3.Database(TEST_DB_PATH);

async function query(sql: string, params: any[] = []): Promise<any> {
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

async function main() {
  try {
    console.log('Checking recipe_details table...\n');

    // Get table structure
    const columns = await query('PRAGMA table_info(recipe_details)');
    console.log('Table structure:');
    columns.forEach((col: any) => {
      console.log(`  ${col.name} (${col.type})`);
    });
    console.log();

    // Get sample data
    const details = await query('SELECT * FROM recipe_details LIMIT 5');
    console.log('Sample data:');
    details.forEach((row: any) => {
      console.log(row);
    });
    console.log();

    // Get a complete recipe with its details
    const recipe = await query(`
      SELECT r.name as recipe_name, rd.*, m.name as material_name
      FROM recipes r
      JOIN recipe_details rd ON r.id = rd.recipe_id
      JOIN materials m ON rd.material_id = m.id
      WHERE r.id = 1
    `);
    console.log('Complete recipe example:');
    recipe.forEach((row: any) => {
      console.log(row);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    db.close();
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 