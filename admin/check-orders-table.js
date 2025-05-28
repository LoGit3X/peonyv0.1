// Check if orders table exists and create it if needed
import sqlite3 from 'sqlite3';
import { resolve } from 'path';

// Enable verbose mode for better error messages
sqlite3.verbose();

// Path to the database file
const dbPath = resolve(process.cwd(), 'data', 'peony_cafe.db');
console.log(`Checking database at: ${dbPath}`);

// Open the database
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

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

// Main function to check and create tables
async function checkTables() {
  try {
    // Check orders table
    const ordersExists = await tableExists('orders');
    if (!ordersExists) {
      console.log('Orders table does not exist! Creating it...');
      
      // Create orders table
      await runQuery(`
        CREATE TABLE orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_number TEXT NOT NULL UNIQUE,
          customer_name TEXT,
          total_amount INTEGER NOT NULL,
          is_paid INTEGER NOT NULL DEFAULT 0,
          payment_method TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          notes TEXT,
          created_at TEXT NOT NULL,
          jalali_date TEXT NOT NULL,
          jalali_time TEXT NOT NULL
        )
      `);
      console.log('Successfully created orders table!');
    } else {
      console.log('Orders table exists.');
      const orderColumns = await getTableColumns('orders');
      console.log('Columns:', orderColumns.map(c => `${c.name} (${c.type})`).join(', '));
    }
    
    // Check order_items table
    const orderItemsExists = await tableExists('order_items');
    if (!orderItemsExists) {
      console.log('Order items table does not exist! Creating it...');
      
      // Create order_items table
      await runQuery(`
        CREATE TABLE order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          menu_item_id INTEGER NOT NULL,
          menu_item_name TEXT NOT NULL,
          price INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          total_price INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        )
      `);
      console.log('Successfully created order_items table!');
    } else {
      console.log('Order items table exists.');
      const itemColumns = await getTableColumns('order_items');
      console.log('Columns:', itemColumns.map(c => `${c.name} (${c.type})`).join(', '));
    }
    
    // Check if sales_summary table has correct columns
    const salesSummaryExists = await tableExists('sales_summary');
    if (salesSummaryExists) {
      const summaryColumns = await getTableColumns('sales_summary');
      const columnNames = summaryColumns.map(c => c.name);
      console.log('Sales summary columns:', columnNames.join(', '));
      
      // Check if it has total_sales and total_orders columns
      const hasTotalSales = columnNames.includes('total_sales');
      const hasTotalOrders = columnNames.includes('total_orders');
      
      if (!hasTotalSales || !hasTotalOrders) {
        console.log('Sales summary table has incorrect schema!');
      } else {
        console.log('Sales summary table has correct schema.');
      }
    }
    
  } catch (error) {
    console.error('Error checking/creating tables:', error);
  } finally {
    db.close();
    console.log('Database connection closed.');
  }
}

// Run the check
checkTables(); 