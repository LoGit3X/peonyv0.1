// Migration to update the materials table structure
console.log("Starting materials table update migration...");

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

async function run() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const dbPath = path.resolve(__dirname, '../data/peony_cafe.db');
  
  console.log(`Connecting to database at: ${dbPath}`);
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Failed to connect to the database:', err);
      process.exit(1);
    }
    
    console.log('Successfully connected to the database. Starting migration...');
    
    // Begin a transaction for safety
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Step 1: Create a new table without the category and unit columns
      db.run(`
        CREATE TABLE materials_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price INTEGER NOT NULL,
          stock INTEGER NOT NULL DEFAULT 0,
          description TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `, function(err) {
        if (err) {
          console.error('Error creating new materials table:', err);
          db.run('ROLLBACK');
          db.close();
          process.exit(1);
        }
        
        console.log('Created new materials table structure');
        
        // Step 2: Copy data from the old table to the new one
        db.run(`
          INSERT INTO materials_new (id, name, price, stock, description, created_at, updated_at)
          SELECT id, name, price, stock, description, created_at, updated_at FROM materials
        `, function(err) {
          if (err) {
            console.error('Error copying data to new materials table:', err);
            db.run('ROLLBACK');
            db.close();
            process.exit(1);
          }
          
          console.log('Data copied to new table successfully');
          
          // Step 3: Drop the old table
          db.run('DROP TABLE materials', function(err) {
            if (err) {
              console.error('Error dropping old materials table:', err);
              db.run('ROLLBACK');
              db.close();
              process.exit(1);
            }
            
            console.log('Dropped old materials table');
            
            // Step 4: Rename the new table to the original name
            db.run('ALTER TABLE materials_new RENAME TO materials', function(err) {
              if (err) {
                console.error('Error renaming new materials table:', err);
                db.run('ROLLBACK');
                db.close();
                process.exit(1);
              }
              
              console.log('Renamed new table to materials');
              
              // Commit the transaction if everything went well
              db.run('COMMIT', function(err) {
                if (err) {
                  console.error('Error committing transaction:', err);
                  db.run('ROLLBACK');
                } else {
                  console.log('Migration completed successfully!');
                }
                
                // Close the database connection
                db.close(() => {
                  console.log('Database connection closed');
                });
              });
            });
          });
        });
      });
    });
  });
}

run(); 