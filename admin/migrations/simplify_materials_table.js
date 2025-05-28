import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'data', 'local.db');

async function run() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err);
      process.exit(1);
    }
  });

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Create new table with simplified schema
    db.run(`
      CREATE TABLE materials_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
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
      
      // Copy data from the old table to the new one
      db.run(`
        INSERT INTO materials_new (id, name, price, created_at, updated_at)
        SELECT id, name, price, created_at, updated_at FROM materials
      `, function(err) {
        if (err) {
          console.error('Error copying data to new table:', err);
          db.run('ROLLBACK');
          db.close();
          process.exit(1);
        }
        
        console.log('Copied data to new table');
        
        // Drop the old table
        db.run('DROP TABLE materials', function(err) {
          if (err) {
            console.error('Error dropping old table:', err);
            db.run('ROLLBACK');
            db.close();
            process.exit(1);
          }
          
          console.log('Dropped old table');
          
          // Rename the new table
          db.run('ALTER TABLE materials_new RENAME TO materials', function(err) {
            if (err) {
              console.error('Error renaming new table:', err);
              db.run('ROLLBACK');
              db.close();
              process.exit(1);
            }
            
            console.log('Renamed new table');
            
            // Commit the transaction
            db.run('COMMIT', function(err) {
              if (err) {
                console.error('Error committing transaction:', err);
                db.run('ROLLBACK');
              } else {
                console.log('Successfully updated materials table schema');
              }
              
              db.close();
            });
          });
        });
      });
    });
  });
}

run().catch(console.error); 