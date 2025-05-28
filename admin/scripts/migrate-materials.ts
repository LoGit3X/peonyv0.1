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

async function getTableInfo(db: sqlite3.Database, tableName: string): Promise<any[]> {
  return query(db, `PRAGMA table_info(${tableName})`);
}

async function main() {
  try {
    console.log('Starting materials migration...');

    // Get table structure from test database
    console.log('Checking test database table structure...');
    const tableInfo = await getTableInfo(testDb, 'materials');
    console.log('Materials table columns:', tableInfo.map(col => col.name));

    // Clear existing materials from main database
    console.log('Clearing existing materials...');
    await run(mainDb, 'DELETE FROM materials');
    await run(mainDb, 'DELETE FROM sqlite_sequence WHERE name = "materials"');

    // Build dynamic query based on available columns
    const columns = tableInfo.map(col => col.name);
    const selectColumns = ['name'];
    if (columns.includes('price')) selectColumns.push('price');
    if (columns.includes('cost')) selectColumns.push('cost as price');
    if (columns.includes('unit')) selectColumns.push('unit');
    if (columns.includes('stock')) selectColumns.push('stock');

    // Get materials from test database
    console.log('Reading materials from test database...');
    const materials = await query(testDb, `SELECT ${selectColumns.join(', ')} FROM materials`);
    console.log(`Found ${materials.length} materials in test database`);

    // Insert materials into main database
    console.log('Inserting materials into main database...');
    const now = new Date().toISOString();
    
    for (const material of materials) {
      await run(
        mainDb,
        `INSERT INTO materials (name, category, price, unit, stock, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          material.name,
          'عمومی', // Default category
          material.price || 0, // Default price if not specified
          material.unit || 'گرم', // Default unit if not specified
          material.stock || 0, // Default stock if not specified
          now,
          now
        ]
      );
      console.log(`Inserted material: ${material.name}`);
    }

    console.log('Migration completed successfully!');
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