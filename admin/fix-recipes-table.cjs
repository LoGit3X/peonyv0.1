/**
 * این اسکریپت برای بررسی و اصلاح جدول recipes طراحی شده است
 * در صورت لزوم، ستون description را به جدول اضافه می‌کند
 */

const sqlite3 = require('sqlite3').verbose();
const { resolve } = require('path');
const fs = require('fs');

// Ensure data directory exists
const DATA_DIR = resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`Created data directory at: ${DATA_DIR}`);
}

// Path to the database
const DB_PATH = resolve(DATA_DIR, 'peony_cafe.db');
console.log(`Connecting to SQLite database at: ${DB_PATH}`);

// Open the database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log(`Successfully connected to SQLite database at: ${DB_PATH}`);
});

// Utility function to execute SQL as a Promise
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('SQL Error:', err.message);
        console.error('SQL Query:', sql);
        console.error('SQL Params:', JSON.stringify(params));
        return reject(err);
      }
      resolve(this); // this contains lastID and changes properties
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('SQL Error:', err.message);
        console.error('SQL Query:', sql);
        console.error('SQL Params:', JSON.stringify(params));
        return reject(err);
      }
      resolve(row);
    });
  });
}

function all(sql, params = []) {
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

// Main function to check and fix the recipes table
async function checkAndFixRecipesTable() {
  try {
    console.log('Checking recipes table structure...');

    // Check if the recipes table exists
    const tableExists = await get("SELECT name FROM sqlite_master WHERE type='table' AND name='recipes'");
    if (!tableExists) {
      console.error('Error: recipes table does not exist!');
      process.exit(1);
    }

    // Get current table structure
    const columns = await all("PRAGMA table_info(recipes)");
    console.log('Current recipes table columns:', columns.map(col => col.name));

    // Check if description column exists
    const descriptionColumn = columns.find(col => col.name === 'description');
    
    if (!descriptionColumn) {
      console.log('Description column does not exist. Adding it...');
      
      try {
        await run("ALTER TABLE recipes ADD COLUMN description TEXT");
        console.log('Successfully added description column to recipes table.');
      } catch (alterError) {
        console.error('Error adding description column:', alterError);
      }
    } else {
      console.log('Description column already exists.');
    }

    // Test updating a recipe with description
    console.log('Testing recipe update with description...');
    
    // Get first recipe for testing
    const testRecipe = await get("SELECT id, name FROM recipes LIMIT 1");
    
    if (testRecipe) {
      console.log(`Testing with recipe: ${testRecipe.id} - ${testRecipe.name}`);
      
      try {
        // Update the test recipe with a description
        const testDescription = `This is a test description for ${testRecipe.name} - ${new Date().toISOString()}`;
        await run(
          "UPDATE recipes SET description = ? WHERE id = ?", 
          [testDescription, testRecipe.id]
        );
        
        // Verify the update
        const updatedRecipe = await get("SELECT id, name, description FROM recipes WHERE id = ?", [testRecipe.id]);
        
        if (updatedRecipe && updatedRecipe.description === testDescription) {
          console.log('✅ Test update successful! The table is working correctly.');
          console.log('Updated recipe:', updatedRecipe);
        } else {
          console.error('❌ Test update verification failed!');
          console.log('Expected:', testDescription);
          console.log('Got:', updatedRecipe ? updatedRecipe.description : 'null');
        }
      } catch (updateError) {
        console.error('Error during test update:', updateError);
      }
    } else {
      console.log('No recipes found for testing.');
    }

    console.log('Table check and fix completed.');
  } catch (error) {
    console.error('Error checking and fixing recipes table:', error);
  } finally {
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
    });
  }
}

// Run the check and fix
checkAndFixRecipesTable(); 