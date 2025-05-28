// Check tables in SQLite database
import sqlite3 from 'sqlite3';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the database file
const dbPath = resolve(process.cwd(), 'data', 'peony_cafe.db');
console.log(`Checking database at: ${dbPath}`);

// Enable verbose mode for better error messages
sqlite3.verbose();

// Open the database
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Get list of all tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
  if (err) {
    console.error('Error getting tables:', err.message);
    closeDb();
    return;
  }
  
  console.log('Available tables:');
  tables.forEach(table => {
    console.log(`- ${table.name}`);
  });
  
  // Check if sales_summary table exists
  const salesSummaryTable = tables.find(t => t.name === 'sales_summary');
  if (!salesSummaryTable) {
    console.log('\nSales summary table does not exist! Creating it...');
    createSalesSummaryTable();
  } else {
    console.log('\nChecking sales_summary table structure...');
    checkSalesSummaryTable();
  }
});

// Check sales_summary table structure
function checkSalesSummaryTable() {
  db.all("PRAGMA table_info(sales_summary)", [], (err, columns) => {
    if (err) {
      console.error('Error getting table info:', err.message);
      closeDb();
      return;
    }
    
    console.log('sales_summary table columns:');
    columns.forEach(col => {
      console.log(`- ${col.name} (${col.type})`);
    });
    
    // Check for any rows in the table
    db.get("SELECT COUNT(*) as count FROM sales_summary", [], (err, result) => {
      if (err) {
        console.error('Error counting rows:', err.message);
      } else {
        console.log(`\nThe sales_summary table contains ${result.count} rows.`);
      }
      closeDb();
    });
  });
}

// Create sales_summary table if it doesn't exist
function createSalesSummaryTable() {
  const createTableSQL = `
    CREATE TABLE sales_summary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      total_sales INTEGER NOT NULL DEFAULT 0,
      total_orders INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.run(createTableSQL, [], function(err) {
    if (err) {
      console.error('Error creating sales_summary table:', err.message);
    } else {
      console.log('Successfully created sales_summary table!');
    }
    closeDb();
  });
}

// Close the database connection
function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
} 