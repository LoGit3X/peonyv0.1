import { drizzle } from 'drizzle-orm/sqlite';
import * as schema from "@shared/schema.sqlite";
import { resolve } from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';

// Enable verbose mode for more detailed error messages
sqlite3.verbose();

// Ensure data directory exists
const DATA_DIR = resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`Created data directory at: ${DATA_DIR}`);
}

// Create SQLite database connection
const DB_PATH = resolve(DATA_DIR, 'peony_cafe.db');
console.log(`Attempting to connect to SQLite database at: ${DB_PATH}`);

let sqlite;
try {
  // Open the database with explicit error callback
  sqlite = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      throw err;
    }
    console.log(`Successfully connected to SQLite database at: ${DB_PATH}`);
    
    // Check if we can access the materials table
    sqlite.get("SELECT count(*) as count FROM materials", [], (err, row) => {
      if (err) {
        console.error('Error accessing materials table:', err.message);
      } else {
        console.log(`Materials table contains ${row.count} records`);
      }
    });
  });
} catch (error) {
  console.error('Fatal error initializing database connection:', error);
  process.exit(1);
}

// This is a simplified adapter for drizzle-orm with sqlite3
// It doesn't support all the features, but it's sufficient for our demo
const sqliteConnection = {
  get: (query: string, params: any[] = []) => {
    return new Promise((resolve, reject) => {
      sqlite.get(query, params, function(err, row) {
        if (err) {
          console.error(`Error executing query: ${query}`, err);
          reject(err);
        }
        else resolve(row);
      });
    });
  },
  all: (query: string, params: any[] = []) => {
    return new Promise((resolve, reject) => {
      sqlite.all(query, params, function(err, rows) {
        if (err) {
          console.error(`Error executing query: ${query}`, err);
          reject(err);
        }
        else resolve(rows);
      });
    });
  },
  run: (query: string, params: any[] = []) => {
    return new Promise<void>((resolve, reject) => {
      sqlite.run(query, params, function(err) {
        if (err) {
          console.error(`Error executing query: ${query}`, err);
          reject(err);
        }
        else resolve();
      });
    });
  },
  exec: (query: string) => {
    return new Promise<void>((resolve, reject) => {
      sqlite.exec(query, function(err) {
        if (err) {
          console.error(`Error executing query: ${query}`, err);
          reject(err);
        }
        else resolve();
      });
    });
  },
};

// Use a simpler approach with direct sqlite3 commands
export { sqlite, sqliteConnection as db }; 