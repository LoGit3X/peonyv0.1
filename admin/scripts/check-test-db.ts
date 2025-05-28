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
    console.log('Checking test database structure...');

    // Get list of all tables
    const tables = await query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `);

    console.log('\nTables found:', tables.map((t: any) => t.name).join(', '));

    // Get structure of each table
    for (const table of tables) {
      console.log(`\nStructure of table '${table.name}':`);
      const columns = await query(`PRAGMA table_info('${table.name}')`);
      columns.forEach((col: any) => {
        console.log(`  ${col.name} (${col.type})`);
      });

      // Get sample data from each table
      const sampleData = await query(`SELECT * FROM '${table.name}' LIMIT 1`);
      if (sampleData.length > 0) {
        console.log(`  Sample data:`, sampleData[0]);
      }
    }

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