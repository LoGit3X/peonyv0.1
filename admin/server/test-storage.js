// Test file to verify storage functions
import { sqliteStorage } from './storage-sqlite.js';

console.log('========== TESTING STORAGE ==========');
console.log('storage keys:', Object.keys(sqliteStorage));

const testStats = async () => {
  try {
    console.log('Testing getMaterialsCount...');
    if (typeof sqliteStorage.getMaterialsCount === 'function') {
      const count = await sqliteStorage.getMaterialsCount();
      console.log('Materials count:', count);
    } else {
      console.log('getMaterialsCount is NOT a function');
    }
    
    console.log('Testing getRecipesCount...');
    if (typeof sqliteStorage.getRecipesCount === 'function') {
      const count = await sqliteStorage.getRecipesCount();
      console.log('Recipes count:', count);
    } else {
      console.log('getRecipesCount is NOT a function');
    }
  } catch (error) {
    console.error('Error testing storage:', error);
  }
};

testStats(); 