// Fix sales_summary table in SQLite database
import sqlite3 from 'sqlite3';
import { resolve } from 'path';

// Enable verbose mode for better error messages
sqlite3.verbose();

// Path to the database file
const dbPath = resolve(process.cwd(), 'data', 'peony_cafe.db');
console.log(`Fixing database at: ${dbPath}`);

// Open the database
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Main function
async function fixSalesSummaryTable() {
  try {
    // 1. Rename the existing table if it exists
    await runQuery(`
      DROP TABLE IF EXISTS sales_summary_old
    `);
    
    await runQuery(`
      ALTER TABLE sales_summary RENAME TO sales_summary_old
    `);
    
    console.log('Renamed existing sales_summary table to sales_summary_old');
    
    // 2. Create new table with correct schema
    await runQuery(`
      CREATE TABLE sales_summary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        total_sales INTEGER NOT NULL DEFAULT 0,
        total_orders INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Created new sales_summary table with correct schema');
    
    // 3. Try to migrate data from old table if possible
    const hasOldTable = await tableExists('sales_summary_old');
    
    if (hasOldTable) {
      // Check old table structure
      const columns = await getTableColumns('sales_summary_old');
      console.log('Old table columns:', columns.map(c => c.name));
      
      // If old table had 'total_amount' instead of 'total_sales'
      if (columns.some(c => c.name === 'total_amount')) {
        await runQuery(`
          INSERT INTO sales_summary (date, total_sales, created_at)
          SELECT date, total_amount, created_at
          FROM sales_summary_old
        `);
        console.log('Migrated data from old table structure');
      }
      
      // Drop the old table
      await runQuery(`
        DROP TABLE sales_summary_old
      `);
      console.log('Dropped old table');
    }
    
    console.log('Successfully fixed sales_summary table!');
  } catch (error) {
    console.error('Error fixing sales_summary table:', error);
  } finally {
    db.close();
    console.log('Database connection closed.');
  }
}

// Helper function to run SQL queries as promises
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

// Check if a table exists
function tableExists(tableName) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      [tableName],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      }
    );
  });
}

// Get table columns
function getTableColumns(tableName) {
  return new Promise((resolve, reject) => {
    db.all(
      `PRAGMA table_info(${tableName})`,
      [],
      (err, columns) => {
        if (err) {
          reject(err);
        } else {
          resolve(columns);
        }
      }
    );
  });
}

// Run the fix
fixSalesSummaryTable(); 