import Database from 'better-sqlite3';
import { resolve } from 'path';

// Open the database
const db = new Database(resolve(process.cwd(), 'data', 'peony_cafe.db'));

// Get schema for materials table
console.log('Materials table schema:');
const materialsSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='materials'").get();
console.log(materialsSchema.sql);

// Get schema for activities table
console.log('\nActivities table schema:');
const activitiesSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='activities'").get();
console.log(activitiesSchema.sql);

// Get a sample of data from materials table
console.log('\nSample data from materials table:');
const materialsSample = db.prepare("SELECT * FROM materials LIMIT 3").all();
console.log(materialsSample);

// Close the database
db.close();
