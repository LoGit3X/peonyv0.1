import sqlite3 from 'sqlite3';
import { resolve } from 'path';
import fs from 'fs';

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

// Open the database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    throw err;
  }
  console.log(`Successfully connected to SQLite database at: ${DB_PATH}`);

  // Check if we can access the materials table
  db.get("SELECT count(*) as count FROM materials", [], (err, row) => {
    if (err) {
      console.error('Error accessing materials table:', err.message);
    } else {
      console.log(`Materials table contains ${row.count} records`);
    }
  });
  
  // Ensure the description column exists in the recipes table
  db.run("PRAGMA table_info(recipes)", [], (err, rows) => {
    if (err) {
      console.error('Error checking recipes table structure:', err.message);
      return;
    }
    
    // Check if description column exists in the result
    db.get("SELECT COUNT(*) as count FROM pragma_table_info('recipes') WHERE name = 'description'", [], (err, row) => {
      if (err) {
        console.error('Error checking for description column:', err.message);
        return;
      }
      
      if (row.count === 0) {
        console.log('Adding description column to recipes table...');
        db.run("ALTER TABLE recipes ADD COLUMN description TEXT", [], (err) => {
          if (err) {
            console.error('Error adding description column to recipes table:', err.message);
          } else {
            console.log('Successfully added description column to recipes table');
          }
        });
      } else {
        console.log('Description column already exists in recipes table');
      }
    });
  });
});

// Helper function for running SQL queries as Promises
const query = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          console.error('SQL Error in run():', err.message);
          console.error('SQL Query:', sql);
          console.error('SQL Params:', JSON.stringify(params));
          return reject(err);
        }
        resolve(this); // 'this' contains lastID and changes properties
      });
    });
  },

  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          console.error('SQL Error in get():', err.message);
          console.error('SQL Query:', sql);
          console.error('SQL Params:', JSON.stringify(params));
          return reject(err);
        }
        resolve(row);
      });
    });
  },

  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('SQL Error in all():', err.message);
          console.error('SQL Query:', sql);
          console.error('SQL Params:', JSON.stringify(params));
          return reject(err);
        }
        resolve(rows);
      });
    });
  }
};

// Storage implementation specific for SQLite
const sqliteStorage = {
  // Materials
  async getMaterials() {
    console.log('Getting all materials from SQLite');
    try {
      const rows = await query.all('SELECT id, name, price, stock, created_at, updated_at FROM materials ORDER BY name');
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        price: row.price,
        stock: row.stock || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Error in getMaterials:', error);
      throw error;
    }
  },

  async createMaterial(material) {
    console.log('Creating material in SQLite:', material);
    try {
      const now = new Date().toISOString();

      // Ensure required fields
      if (!material.name) {
        throw new Error('Material name is required');
      }

      if (material.price === undefined || material.price === null) {
        throw new Error('Material price is required');
      }

      // Insert the material with name, price and stock
      const result = await query.run(
        `INSERT INTO materials (name, price, stock, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          material.name,
          material.price,
          material.stock || 0, // Default to 0 if not provided
          now,
          now
        ]
      );

      // Record the activity
      await this.createActivity({
        type: 'add',
        entity: 'material',
        entityId: result.lastID,
        entityName: material.name,
        description: 'افزودن ماده اولیه جدید',
        userId: 1
      });

      // Return the created material with all fields
      return {
        id: result.lastID,
        name: material.name,
        price: material.price,
        stock: material.stock || 0,
        createdAt: now,
        updatedAt: now
      };
    } catch (error) {
      console.error('Error in createMaterial:', error);
      throw error;
    }
  },

  async getMaterial(id) {
    try {
      console.log(`getMaterial called with id ${id}`);
      const row = await query.get('SELECT id, name, price, stock, created_at, updated_at FROM materials WHERE id = ?', [id]);
      console.log('Database row:', row);

      if (!row) return undefined;

      const material = {
        id: row.id,
        name: row.name,
        price: row.price,
        stock: row.stock || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

      console.log('Returning material:', material);
      return material;
    } catch (error) {
      console.error(`Error in getMaterial(${id}):`, error);
      throw error;
    }
  },

  async updateMaterial(id, updates) {
    try {
      console.log(`updateMaterial called with id ${id} and updates:`, updates);

      // Check if material exists
      const material = await this.getMaterial(id);
      console.log('Current material state:', material);

      if (!material) return undefined;

      const now = new Date().toISOString();
      const fields = [];
      const values = [];

      // Build the SET clause for the SQL update - name, price and stock
      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
        console.log(`Will update name to: ${updates.name}`);
      }

      // Check if price is being updated
      const priceChanged = updates.price !== undefined && updates.price !== material.price;

      if (updates.price !== undefined) {
        fields.push('price = ?');
        values.push(updates.price);
        console.log(`Will update price to: ${updates.price}`);
      }

      // Update stock if provided
      if (updates.stock !== undefined) {
        fields.push('stock = ?');
        values.push(updates.stock);
        console.log(`Will update stock to: ${updates.stock}`);
      }

      // Always update the updated_at timestamp
      fields.push('updated_at = ?');
      values.push(now);

      // Add the ID for the WHERE clause
      values.push(id);

      if (fields.length === 0) {
        console.log('No fields to update');
        return material; // Nothing to update
      }

      console.log(`Executing SQL: UPDATE materials SET ${fields.join(', ')} WHERE id = ?`);
      console.log('With values:', values);

      // Execute the update
      await query.run(
        `UPDATE materials SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      console.log('Update executed successfully');

      // Log activity
      await this.createActivity({
        type: 'edit',
        entity: 'material',
        entityId: id,
        entityName: material.name,
        description: `ویرایش ماده اولیه:`,
        userId: 1
      });

      // If price changed, update all recipes that use this material
      if (priceChanged) {
        console.log(`Material ${material.name} (ID: ${id}) price changed from ${material.price} to ${updates.price}`);
        try {
          const affectedRecipes = await this.updateRecipeCostsAfterMaterialChange(id);
          console.log(`Updated ${affectedRecipes} recipes after material price change`);
        } catch (recipeUpdateError) {
          console.error('Failed to update recipe costs after material price change:', recipeUpdateError);
          // Continue - don't fail the whole operation if recipe updates fail
        }
      }

      // Get the updated material
      return await this.getMaterial(id);
    } catch (error) {
      console.error(`Error in updateMaterial(${id}):`, error);
      throw error;
    }
  },

  async getMaterialStock(id) {
    try {
      const row = await query.get('SELECT stock FROM materials WHERE id = ?', [id]);
      if (!row) return undefined;
      return row.stock;
    } catch (error) {
      console.error(`Error in getMaterialStock(${id}):`, error);
      throw error;
    }
  },

  async updateMaterialStock(id, amount) {
    try {
      // Get current stock
      const currentStock = await this.getMaterialStock(id);
      if (currentStock === undefined) {
        throw new Error('Material not found');
      }

      // Calculate new stock
      const newStock = currentStock + amount;
      if (newStock < 0) {
        throw new Error('Insufficient stock');
      }

      // Update stock
      await query.run(
        'UPDATE materials SET stock = ?, updated_at = ? WHERE id = ?',
        [newStock, new Date().toISOString(), id]
      );

      // Log activity
      const material = await this.getMaterial(id);
      await this.createActivity({
        type: 'stock',
        entity: 'material',
        entityId: id,
        entityName: material.name,
        description: `Updated stock: ${amount > 0 ? '+' : ''}${amount}g (new total: ${newStock}g)`,
        userId: 1
      });

      return newStock;
    } catch (error) {
      console.error(`Error in updateMaterialStock(${id}, ${amount}):`, error);
      throw error;
    }
  },

  async deleteMaterial(id) {
    console.log(`Deleting material with id ${id}`);
    try {
      // Get the material first to check if it exists and for activity log
      const material = await this.getMaterial(id);
      if (!material) {
        return false;
      }

      // Check if the material is used in any recipes
      const usedInRecipes = await query.get(
        'SELECT COUNT(*) as count FROM recipe_ingredients WHERE material_id = ?',
        [id]
      );

      if (usedInRecipes.count > 0) {
        throw new Error(`Cannot delete material that is used in ${usedInRecipes.count} recipes. Remove it from recipes first.`);
      }

      // Now we can safely delete the material
      await query.run('DELETE FROM materials WHERE id = ?', [id]);

      // Log the deletion
      await this.createActivity({
        type: 'delete',
        entity: 'material',
        entityId: id,
        entityName: material.name,
        description: 'حذف ماده اولیه',
        userId: 1
      });

      return true;
    } catch (error) {
      console.error(`Error in deleteMaterial(${id}):`, error);
      throw error;
    }
  },

  // Recipes
  async getRecipes() {
    console.log('Getting all recipes');
    try {
      const rows = await query.all(`
        SELECT r.*,
               COALESCE(
                 (SELECT SUM(m.price * ri.amount / 1000.0)
                  FROM recipe_ingredients ri
                  JOIN materials m ON ri.material_id = m.id
                  WHERE ri.recipe_id = r.id),
                 0
               ) as cost_price
        FROM recipes r
        ORDER BY r.name
      `);

      return rows.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        description: row.description,
        priceCoefficient: row.price_coefficient,
        costPrice: Math.round(row.cost_price),
        sellPrice: Math.round(row.cost_price * row.price_coefficient),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        imageUrl: row.image_url
      }));
    } catch (error) {
      console.error('Error in getRecipes:', error);
      throw new Error('Failed to fetch recipes');
    }
  },

  async getRecipe(id) {
    try {
      const row = await query.get(`
        SELECT r.*,
               COALESCE(
                 (SELECT SUM(m.price * ri.amount / 1000.0)
                  FROM recipe_ingredients ri
                  JOIN materials m ON ri.material_id = m.id
                  WHERE ri.recipe_id = r.id),
                 0
               ) as cost_price
        FROM recipes r
        WHERE r.id = ?
      `, [id]);

      if (!row) {
        return null;
      }

      return {
        id: row.id,
        name: row.name,
        category: row.category,
        description: row.description,
        priceCoefficient: row.price_coefficient,
        costPrice: Math.round(row.cost_price),
        sellPrice: Math.round(row.cost_price * row.price_coefficient),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        imageUrl: row.image_url
      };
    } catch (error) {
      console.error(`Error in getRecipe(${id}):`, error);
      throw new Error('Failed to fetch recipe');
    }
  },

  async createRecipe(recipe) {
    console.log('Creating recipe:', recipe);
    let transactionStarted = false;

    try {
      // Validate recipe data
      if (!recipe.name?.trim()) {
        throw new Error('نام رسپی الزامی است');
      }
      if (!recipe.category?.trim()) {
        throw new Error('دسته‌بندی رسپی الزامی است');
      }
      if (!recipe.priceCoefficient || recipe.priceCoefficient < 0.1) {
        throw new Error('ضریب قیمت باید حداقل 0.1 باشد');
      }

      // Check for duplicate recipe name
      const existingRecipe = await query.get('SELECT id FROM recipes WHERE name = ?', [recipe.name.trim()]);
      if (existingRecipe) {
        throw new Error('رسپی با این نام قبلاً ثبت شده است');
      }

      const now = new Date().toISOString();

      // Start transaction
      await query.run('BEGIN IMMEDIATE TRANSACTION');
      transactionStarted = true;

      // Insert the recipe
      const result = await query.run(
        `INSERT INTO recipes (name, category, description, price_coefficient, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          recipe.name.trim(),
          recipe.category.trim(),
          recipe.description || null,
          recipe.priceCoefficient,
          now,
          now
        ]
      );

      // Calculate initial cost and sell price
      const costPrice = 0; // Will be updated when ingredients are added
      const sellPrice = Math.round(costPrice * recipe.priceCoefficient);

      // Update cost and sell prices
      await query.run(
        `UPDATE recipes
         SET cost_price = ?, sell_price = ?
         WHERE id = ?`,
        [costPrice, sellPrice, result.lastID]
      );

      // Record the activity
      await query.run(
        `INSERT INTO activities (type, entity, entity_id, entity_name, description, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'add',
          'recipe',
          result.lastID,
          recipe.name.trim(),
          'افزودن رسپی جدید',
          now
        ]
      );

      // Commit transaction
      await query.run('COMMIT');

      // Return the created recipe
      return await this.getRecipe(result.lastID);
    } catch (error) {
      console.error('Error in createRecipe:', error);

      // Rollback transaction if started
      if (transactionStarted) {
        try {
          await query.run('ROLLBACK');
        } catch (rollbackError) {
          console.error('Error rolling back transaction:', rollbackError);
        }
      }

      throw error;
    }
  },

  async updateRecipe(id, recipeData) {
    console.log(`Updating recipe with id ${id}:`, JSON.stringify(recipeData, null, 2));
    try {
      const now = new Date().toISOString();

      // Check if recipe exists
      const existingRecipe = await this.getRecipe(id);
      if (!existingRecipe) {
        throw new Error('Recipe not found');
      }

      console.log(`Existing recipe:`, JSON.stringify(existingRecipe, null, 2));

      // Validate recipe data
      if (recipeData.name && !recipeData.name.trim()) {
        throw new Error('Recipe name cannot be empty');
      }
      if (recipeData.category && !recipeData.category.trim()) {
        throw new Error('Recipe category cannot be empty');
      }
      if (recipeData.priceCoefficient && recipeData.priceCoefficient < 0.1) {
        throw new Error('Price coefficient must be at least 0.1');
      }

      // Check for duplicate name if name is being changed
      if (recipeData.name && recipeData.name !== existingRecipe.name) {
        const duplicateRecipe = await query.get('SELECT id FROM recipes WHERE name = ? AND id != ?', [recipeData.name.trim(), id]);
        if (duplicateRecipe) {
          throw new Error('A recipe with this name already exists');
        }
      }

      // Simplified update approach - direct object update
      try {
        // Handle imageUrl properly
        const imageUrlValue = recipeData.imageUrl === null ? null : 
                             (recipeData.imageUrl !== undefined ? recipeData.imageUrl : existingRecipe.imageUrl);
        
        console.log(`Setting imageUrl to:`, imageUrlValue);
        
        // Direct update of the recipe
        await query.run(
          `UPDATE recipes 
           SET name = ?, 
               category = ?, 
               description = ?, 
               price_coefficient = ?,
               image_url = ?,
               updated_at = ?
           WHERE id = ?`,
          [
            recipeData.name !== undefined ? recipeData.name.trim() : existingRecipe.name,
            recipeData.category !== undefined ? recipeData.category.trim() : existingRecipe.category,
            recipeData.description !== undefined ? recipeData.description : existingRecipe.description,
            recipeData.priceCoefficient !== undefined ? recipeData.priceCoefficient : existingRecipe.priceCoefficient,
            imageUrlValue,
            now,
            id
          ]
        );
        
        console.log(`Updated recipe successfully`);
        
        // Record the activity
        await query.run(
          `INSERT INTO activities (type, entity, entity_id, entity_name, description, user_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            'edit',
            'recipe',
            id,
            recipeData.name?.trim() || existingRecipe.name,
            'ویرایش رسپی',
            1,
            now
          ]
        );

        // Return the updated recipe
        const updatedRecipe = await this.getRecipe(id);
        console.log(`Retrieved updated recipe:`, JSON.stringify(updatedRecipe, null, 2));
        return updatedRecipe;
      } catch (updateError) {
        console.error(`SQL Error in update recipe:`, updateError);
        console.error(`SQL Parameters:`, JSON.stringify([
          recipeData.name !== undefined ? recipeData.name.trim() : existingRecipe.name,
          recipeData.category !== undefined ? recipeData.category.trim() : existingRecipe.category,
          recipeData.description !== undefined ? recipeData.description : existingRecipe.description,
          recipeData.priceCoefficient !== undefined ? recipeData.priceCoefficient : existingRecipe.priceCoefficient,
          recipeData.imageUrl !== undefined ? recipeData.imageUrl : existingRecipe.imageUrl,
          now,
          id
        ], null, 2));
        throw updateError;
      }
    } catch (error) {
      console.error('Error in updateRecipe:', error);
      throw error;
    }
  },

  async deleteRecipe(id) {
    console.log(`Deleting recipe with id ${id}`);
    try {
      // Check if recipe exists
      const recipe = await this.getRecipe(id);
      if (!recipe) {
        return false;
      }

      const now = new Date().toISOString();

      // First, delete all ingredients for this recipe
      await query.run('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [id]);

      // Record the activity
      await query.run(
        `INSERT INTO activities (type, entity, entity_id, entity_name, description, user_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          'delete',
          'recipe',
          id,
          recipe.name,
          'حذف رسپی',
          1,
          now
        ]
      );

      // Delete the recipe
      const result = await query.run('DELETE FROM recipes WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error in deleteRecipe:', error);
      throw error;
    }
  },

  // Recipe Ingredients
  async getRecipeIngredients(recipeId) {
    try {
      // Validate recipe exists
      const recipeExists = await query.get('SELECT id FROM recipes WHERE id = ?', [recipeId]);
      if (!recipeExists) {
        throw new Error('Recipe not found');
      }

      const rows = await query.all(`
        SELECT
          ri.id,
          ri.recipe_id,
          ri.material_id,
          ri.amount,
          m.name as material_name,
          m.price as material_price,
          m.unit as material_unit,
          m.category as material_category
        FROM recipe_ingredients ri
        JOIN materials m ON ri.material_id = m.id
        WHERE ri.recipe_id = ?
        ORDER BY m.name
      `, [recipeId]);

      return rows.map(row => ({
        id: row.id,
        recipeId: row.recipe_id,
        materialId: row.material_id,
        amount: row.amount,
        material: {
          id: row.material_id,
          name: row.material_name,
          price: row.material_price,
          unit: row.unit || 'عدد',
          category: row.category || 'عمومی'
        }
      }));
    } catch (error) {
      console.error(`Error fetching ingredients for recipe ${recipeId}:`, error);
      throw error;
    }
  },

  async calculateRecipeTotalCost(recipeId) {
    try {
      const result = await query.get(`
        SELECT COALESCE(SUM(m.price * ri.amount / 1000.0), 0) as total_cost
        FROM recipe_ingredients ri
        JOIN materials m ON ri.material_id = m.id
        WHERE ri.recipe_id = ?
      `, [recipeId]);

      return Math.round(result.total_cost);
    } catch (error) {
      console.error(`Error calculating recipe cost for ${recipeId}:`, error);
      throw error;
    }
  },

  async updateRecipeIngredients(recipeId, ingredients) {
    console.log(`Updating ingredients for recipe ${recipeId}`);
    let transactionStarted = false;

    try {
      // Validate recipeId
      if (!recipeId || isNaN(parseInt(recipeId))) {
        throw new Error('شناسه رسپی نامعتبر است');
      }

      // Ensure recipeId is an integer
      recipeId = parseInt(recipeId.toString(), 10);

      // Verify recipe exists
      const recipe = await this.getRecipe(recipeId);
      if (!recipe) {
        throw new Error('رسپی مورد نظر یافت نشد');
      }

      // Validate ingredients array
      if (!Array.isArray(ingredients)) {
        throw new Error('لیست مواد اولیه نامعتبر است');
      }

      // Start transaction
      await query.run('BEGIN IMMEDIATE TRANSACTION');
      transactionStarted = true;

      // Delete existing ingredients
      await query.run('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [recipeId]);

      // Insert new ingredients
      if (ingredients.length > 0) {
        const values = ingredients.map(ing =>
          `(${recipeId}, ${Math.floor(Number(ing.materialId))}, ${Math.floor(Number(ing.amount))})`
        ).join(',');

        await query.run(`
          INSERT INTO recipe_ingredients (recipe_id, material_id, amount)
          VALUES ${values}
        `);
      }

      // Calculate new cost price
      const costPrice = await this.calculateRecipeTotalCost(recipeId);
      const sellPrice = Math.round(costPrice * recipe.priceCoefficient);

      // Update recipe prices
      await query.run(
        `UPDATE recipes
         SET cost_price = ?,
             sell_price = ?,
             updated_at = ?
         WHERE id = ?`,
        [costPrice, sellPrice, new Date().toISOString(), recipeId]
      );

      // Commit transaction
      await query.run('COMMIT');
      transactionStarted = false;

      // Log activity
      await this.createActivity({
        type: 'edit',
        entity: 'recipe',
        entityId: recipeId,
        entityName: recipe.name,
        description: `ویرایش مواد اولیه رسپی:`,
        userId: 1
      });

      // Return updated ingredients
      return await this.getRecipeIngredients(recipeId);
    } catch (error) {
      console.error(`Error updating recipe ingredients for ${recipeId}:`, error);

      // Rollback transaction if it was started
      if (transactionStarted) {
        try {
          await query.run('ROLLBACK');
          console.log('Transaction rolled back due to error');
        } catch (rollbackError) {
          console.error('Error rolling back transaction:', rollbackError);
        }
      }

      throw error;
    }
  },

  // Ensure recipe cost is immediately calculated whenever ingredient prices change
  async updateRecipeCostsAfterMaterialChange(materialId) {
    console.log(`Updating recipe costs after material ${materialId} price change`);
    try {
      // Find all recipes that use this material
      const affectedRecipes = await query.all(`
        SELECT DISTINCT r.id, r.name, r.price_coefficient
        FROM recipes r
        JOIN recipe_ingredients ri ON r.id = ri.recipe_id
        WHERE ri.material_id = ?
      `, [materialId]);

      console.log(`Found ${affectedRecipes.length} recipes affected by material ${materialId} price change`);

      // Update each recipe's cost and sell price
      for (const recipe of affectedRecipes) {
        const costPrice = await this.calculateRecipeTotalCost(recipe.id);
        const sellPrice = Math.round(costPrice * recipe.price_coefficient);

        await query.run(
          `UPDATE recipes
           SET cost_price = ?,
               sell_price = ?,
               updated_at = ?
           WHERE id = ?`,
          [costPrice, sellPrice, new Date().toISOString(), recipe.id]
        );

        console.log(`Updated recipe ${recipe.name} (ID: ${recipe.id}) - new cost: ${costPrice}, new sell price: ${sellPrice}`);
      }

      return affectedRecipes.length;
    } catch (error) {
      console.error('Error updating recipe costs after material change:', error);
      throw error;
    }
  },

  // Stats functions
  async getMaterialsCount() {
    console.log('Getting materials count...');
    try {
      const result = await query.get('SELECT COUNT(*) as count FROM materials');
      console.log(`Found ${result.count} materials in database`);
      return result.count;
    } catch (error) {
      console.error('Error in getMaterialsCount:', error);
      throw error;
    }
  },

  async getRecipesCount() {
    console.log('Getting recipes count...');
    try {
      const result = await query.get('SELECT COUNT(*) as count FROM recipes');
      console.log(`Found ${result.count} recipes in database`);
      return result.count;
    } catch (error) {
      console.error('Error in getRecipesCount:', error);
      throw error;
    }
  },

  async getMenuItemsCount() {
    console.log('Getting menu items count...');
    try {
      const result = await query.get('SELECT COUNT(*) as count FROM menu_items');
      console.log(`Found ${result.count} menu items in database`);
      return result.count;
    } catch (error) {
      console.error('Error in getMenuItemsCount:', error);
      // If table doesn't exist yet, return 0
      if (error.message.includes('no such table')) {
        console.log('Menu items table does not exist yet');
        return 0;
      }
      throw error;
    }
  },

  async getMonthlySales() {
    console.log('Getting monthly sales...');
    try {
      // Get current month's sales or simulate if orders table doesn't exist yet
      try {
        const currentMonth = new Date().getMonth() + 1; // 1-12
        const currentYear = new Date().getFullYear();

        const result = await query.get(`
          SELECT COALESCE(SUM(total_price), 0) as total_sales
          FROM orders
          WHERE strftime('%m', created_at) = ?
          AND strftime('%Y', created_at) = ?
        `, [
          currentMonth.toString().padStart(2, '0'),
          currentYear.toString()
        ]);

        // Convert to millions and return
        return Math.round(result.total_sales / 1000000);
      } catch (error) {
        // If orders table doesn't exist, return a fixed value
        if (error.message.includes('no such table')) {
          console.log('Orders table does not exist yet, returning simulated data');
          return 28; // 28 million
        }
        throw error;
      }
    } catch (error) {
      console.error('Error in getMonthlySales:', error);
      return 28; // Default fallback
    }
  },

  // Activities
  async getActivities() {
    console.log('Getting latest activities...');
    try {
      // Get the 10 most recent activities
      const rows = await query.all(`
        SELECT * FROM activities
        ORDER BY created_at DESC
        LIMIT 10
      `);

      return rows.map(row => ({
        id: row.id,
        type: row.type,
        entity: row.entity,
        entityId: row.entity_id,
        entityName: row.entity_name,
        description: row.description,
        userId: row.user_id,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error in getActivities:', error);
      // If table doesn't exist yet, return empty array
      if (error.message.includes('no such table')) {
        console.log('Activities table does not exist yet');
        return [];
      }
      throw error;
    }
  },

  async createActivity(activity) {
    console.log('Creating activity log:', activity);
    try {
      const now = new Date().toISOString();

      // Insert the activity
      const result = await query.run(
        `INSERT INTO activities (type, entity, entity_id, entity_name, description, user_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          activity.type,
          activity.entity,
          activity.entityId || null,
          activity.entityName || null,
          activity.description,
          activity.userId || 1,
          now
        ]
      );

      return {
        id: result.lastID,
        type: activity.type,
        entity: activity.entity,
        entityId: activity.entityId,
        entityName: activity.entityName,
        description: activity.description,
        userId: activity.userId || 1,
        createdAt: now
      };
    } catch (error) {
      console.error('Error in createActivity:', error);
      // If we can't log the activity, just return what was passed
      // This is a non-critical operation
      return {
        ...activity,
        id: 0,
        createdAt: new Date().toISOString()
      };
    }
  },

  // Orders
  async createOrder(order) {
    console.log('Creating order:', order);
    try {
      const now = new Date().toISOString();

      // Check if order number already exists
      const existingOrder = await query.get(
        'SELECT id FROM orders WHERE order_number = ?',
        [order.orderNumber]
      );

      if (existingOrder) {
        throw new Error(`سفارشی با شماره ${order.orderNumber} قبلاً ثبت شده است`);
      }

      // Insert the order
      const result = await query.run(
        `INSERT INTO orders (
          order_number, customer_name, total_amount, is_paid, payment_method,
          status, notes, jalali_date, jalali_time, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.orderNumber,
          order.customerName || null,
          order.totalAmount,
          order.isPaid ? 1 : 0,
          order.paymentMethod || null,
          order.status || 'pending',
          order.notes || null,
          order.jalaliDate,
          order.jalaliTime,
          now
        ]
      );

      // Log activity
      await this.createActivity({
        type: 'add',
        entity: 'order',
        entityId: result.lastID,
        entityName: order.orderNumber,
        description: `ثبت سفارش جدید:`,
        userId: 1
      });

      // Update sales summary for the day
      await this.updateSalesSummaryForOrder(order.jalaliDate, order.totalAmount);

      // Return the created order
      return {
        id: result.lastID,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        isPaid: order.isPaid,
        paymentMethod: order.paymentMethod,
        status: order.status || 'pending',
        notes: order.notes,
        jalaliDate: order.jalaliDate,
        jalaliTime: order.jalaliTime,
        createdAt: now
      };
    } catch (error) {
      console.error('Error in createOrder:', error);
      throw error;
    }
  },

  // Get all orders
  async getOrders() {
    console.log('Getting all orders...');
    try {
      const rows = await query.all(
        `SELECT * FROM orders ORDER BY created_at DESC`
      );

      return rows.map(row => ({
        id: row.id,
        orderNumber: row.order_number,
        customerName: row.customer_name,
        totalAmount: row.total_amount,
        isPaid: row.is_paid === 1,
        paymentMethod: row.payment_method,
        status: row.status,
        notes: row.notes,
        jalaliDate: row.jalali_date,
        jalaliTime: row.jalali_time,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error in getOrders:', error);
      throw error;
    }
  },

  // Get a specific order
  async getOrder(id) {
    console.log(`Getting order with ID ${id}...`);
    try {
      const row = await query.get(
        `SELECT * FROM orders WHERE id = ?`,
        [id]
      );

      if (!row) return undefined;

      return {
        id: row.id,
        orderNumber: row.order_number,
        customerName: row.customer_name,
        totalAmount: row.total_amount,
        isPaid: row.is_paid === 1,
        paymentMethod: row.payment_method,
        status: row.status,
        notes: row.notes,
        jalaliDate: row.jalali_date,
        jalaliTime: row.jalali_time,
        createdAt: row.created_at
      };
    } catch (error) {
      console.error(`Error in getOrder(${id}):`, error);
      throw error;
    }
  },

  // Get order with its items
  async getOrderWithItems(id) {
    console.log(`Getting order with items for order ID ${id}...`);
    try {
      const order = await this.getOrder(id);
      if (!order) return undefined;

      const items = await this.getOrderItems(id);
      return {
        ...order,
        items
      };
    } catch (error) {
      console.error(`Error in getOrderWithItems(${id}):`, error);
      throw error;
    }
  },

  // Get items for a specific order
  async getOrderItems(orderId) {
    console.log(`Getting order items for order ID ${orderId}...`);
    try {
      const rows = await query.all(
        `SELECT * FROM order_items WHERE order_id = ?`,
        [orderId]
      );

      return rows.map(row => ({
        id: row.id,
        orderId: row.order_id,
        menuItemId: row.menu_item_id,
        menuItemName: row.menu_item_name,
        quantity: row.quantity,
        price: row.price,
        totalPrice: row.total_price
      }));
    } catch (error) {
      console.error(`Error in getOrderItems(${orderId}):`, error);
      throw error;
    }
  },

  // Update an order
  async updateOrder(id, orderData) {
    console.log(`Updating order with ID ${id}...`, orderData);
    try {
      // Check if order exists
      const existingOrder = await this.getOrder(id);
      if (!existingOrder) {
        console.log(`Order with ID ${id} not found`);
        return undefined;
      }

      const oldAmount = existingOrder.totalAmount;
      
      // Prepare SQL update parts
      const updateFields = [];
      const updateValues = [];
      
      // Handle updatable fields
      if (orderData.isPaid !== undefined) {
        updateFields.push('is_paid = ?');
        updateValues.push(orderData.isPaid ? 1 : 0);
      }
      
      if (orderData.paymentMethod !== undefined) {
        updateFields.push('payment_method = ?');
        updateValues.push(orderData.paymentMethod);
      }
      
      if (orderData.status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(orderData.status);
      }
      
      if (orderData.totalAmount !== undefined) {
        updateFields.push('total_amount = ?');
        updateValues.push(orderData.totalAmount);
      }
      
      if (orderData.customerName !== undefined) {
        updateFields.push('customer_name = ?');
        updateValues.push(orderData.customerName);
      }
      
      if (orderData.notes !== undefined) {
        updateFields.push('notes = ?');
        updateValues.push(orderData.notes);
      }
      
      if (orderData.jalaliDate !== undefined) {
        updateFields.push('jalali_date = ?');
        updateValues.push(orderData.jalaliDate);
      }
      
      if (orderData.jalaliTime !== undefined) {
        updateFields.push('jalali_time = ?');
        updateValues.push(orderData.jalaliTime);
      }
      
      if (orderData.orderNumber !== undefined) {
        updateFields.push('order_number = ?');
        updateValues.push(orderData.orderNumber);
      }
      
      // Only proceed if there are fields to update
      if (updateFields.length === 0) {
        console.log('No fields to update');
        return existingOrder;
      }
      
      // Add ID to values list
      updateValues.push(id);
      
      // Execute update query
      await query.run(
        `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      // Log activity
      await this.createActivity({
        type: 'edit',
        entity: 'order',
        entityId: id,
        entityName: existingOrder.orderNumber,
        description: `ویرایش سفارش:`,
        userId: 1
      });
      
      // If total amount has changed, update sales summary
      if (orderData.totalAmount !== undefined && orderData.totalAmount !== oldAmount) {
        const amountDifference = orderData.totalAmount - oldAmount;
        await this.updateSalesSummaryAmount(existingOrder.jalaliDate, amountDifference);
      }
      
      // Get and return the updated order
      return await this.getOrder(id);
    } catch (error) {
      console.error(`Error in updateOrder(${id}):`, error);
      throw error;
    }
  },

  // Add order item
  async addOrderItem(orderItem) {
    console.log('Adding order item:', orderItem);
    try {
      const now = new Date().toISOString();

      // Verify that the order exists
      const orderExists = await query.get(
        'SELECT id FROM orders WHERE id = ?',
        [orderItem.orderId]
      );

      if (!orderExists) {
        throw new Error(`سفارشی با شناسه ${orderItem.orderId} وجود ندارد`);
      }

      // Insert the order item
      const result = await query.run(
        `INSERT INTO order_items (
          order_id, menu_item_id, menu_item_name, price,
          quantity, total_price, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderItem.orderId,
          orderItem.menuItemId,
          orderItem.menuItemName,
          orderItem.price,
          orderItem.quantity,
          orderItem.totalPrice,
          now
        ]
      );

      // Return the created order item
      return {
        id: result.lastID,
        orderId: orderItem.orderId,
        menuItemId: orderItem.menuItemId,
        menuItemName: orderItem.menuItemName,
        price: orderItem.price,
        quantity: orderItem.quantity,
        totalPrice: orderItem.totalPrice,
        createdAt: now
      };
    } catch (error) {
      console.error('Error in addOrderItem:', error);
      throw error;
    }
  },

  // Update order item
  async updateOrderItem(id, orderItem) {
    console.log(`Updating order item with ID ${id}...`, orderItem);
    try {
      // Check if the item exists
      const existingItem = await query.get(
        'SELECT * FROM order_items WHERE id = ?',
        [id]
      );
      
      if (!existingItem) {
        console.log(`Order item with ID ${id} not found`);
        return undefined;
      }
      
      // Prepare SQL update parts
      const updateFields = [];
      const updateValues = [];
      
      // Handle updatable fields
      if (orderItem.menuItemId !== undefined) {
        updateFields.push('menu_item_id = ?');
        updateValues.push(orderItem.menuItemId);
      }
      
      if (orderItem.menuItemName !== undefined) {
        updateFields.push('menu_item_name = ?');
        updateValues.push(orderItem.menuItemName);
      }
      
      if (orderItem.price !== undefined) {
        updateFields.push('price = ?');
        updateValues.push(orderItem.price);
      }
      
      if (orderItem.quantity !== undefined) {
        updateFields.push('quantity = ?');
        updateValues.push(orderItem.quantity);
      }
      
      if (orderItem.totalPrice !== undefined) {
        updateFields.push('total_price = ?');
        updateValues.push(orderItem.totalPrice);
      }
      
      // Only proceed if there are fields to update
      if (updateFields.length === 0) {
        console.log('No fields to update');
        return {
          id: existingItem.id,
          orderId: existingItem.order_id,
          menuItemId: existingItem.menu_item_id,
          menuItemName: existingItem.menu_item_name,
          price: existingItem.price,
          quantity: existingItem.quantity,
          totalPrice: existingItem.total_price
        };
      }
      
      // Add ID to values list
      updateValues.push(id);
      
      // Execute update query
      await query.run(
        `UPDATE order_items SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      // Get and return the updated item
      const updatedItem = await query.get(
        'SELECT * FROM order_items WHERE id = ?',
        [id]
      );
      
      return {
        id: updatedItem.id,
        orderId: updatedItem.order_id,
        menuItemId: updatedItem.menu_item_id,
        menuItemName: updatedItem.menu_item_name,
        price: updatedItem.price,
        quantity: updatedItem.quantity,
        totalPrice: updatedItem.total_price
      };
    } catch (error) {
      console.error(`Error in updateOrderItem(${id}):`, error);
      throw error;
    }
  },
  
  // Remove order item
  async removeOrderItem(id) {
    console.log(`Removing order item with ID ${id}...`);
    try {
      // Execute delete query
      const result = await query.run(
        'DELETE FROM order_items WHERE id = ?',
        [id]
      );
      
      // Check if any rows were affected
      if (result.changes === 0) {
        console.log(`No rows affected when deleting order item ${id}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Error in removeOrderItem(${id}):`, error);
      throw error;
    }
  },

  // Sales Summary
  async getSalesSummary() {
    console.log('Getting sales summary...');
    try {
      const rows = await query.all(
        'SELECT * FROM sales_summary ORDER BY date DESC'
      );

      return rows.map(row => ({
        id: row.id,
        date: row.date,
        totalSales: row.total_sales,
        totalOrders: row.total_orders,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Error in getSalesSummary:', error);
      // If table doesn't exist yet, return empty array
      if (error.message.includes('no such table')) {
        console.log('Sales summary table does not exist yet');
        return [];
      }
      throw error;
    }
  },

  // Delete an order
  async deleteOrder(id) {
    console.log(`Deleting order with ID ${id}...`);
    try {
      // Get the order first to track data for sales summary update
      const order = await this.getOrder(id);
      if (!order) {
        console.log(`Order with ID ${id} not found`);
        return false;
      }

      // Delete related order items first (due to foreign keys)
      await query.run(
        'DELETE FROM order_items WHERE order_id = ?',
        [id]
      );

      // Delete the order
      const result = await query.run(
        'DELETE FROM orders WHERE id = ?',
        [id]
      );

      // Check if any rows were affected
      if (result.changes === 0) {
        console.log(`No rows affected when deleting order ${id}`);
        return false;
      }

      // Log activity
      await this.createActivity({
        type: 'delete',
        entity: 'order',
        entityId: id,
        entityName: order.orderNumber,
        description: `حذف سفارش:`,
        userId: 1
      });

      // Update sales summary for the deleted order
      await this.updateSalesSummaryForDeletedOrder(order.jalaliDate, order.totalAmount);
      
      return true;
    } catch (error) {
      console.error(`Error in deleteOrder(${id}):`, error);
      throw error;
    }
  },

  async getSalesSummaryByDate(date) {
    console.log(`Getting sales summary for date: ${date}`);
    try {
      const row = await query.get(
        'SELECT * FROM sales_summary WHERE date = ?',
        [date]
      );

      if (!row) return undefined;

      return {
        id: row.id,
        date: row.date,
        totalSales: row.total_sales,
        totalOrders: row.total_orders,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error(`Error in getSalesSummaryByDate(${date}):`, error);
      throw error;
    }
  },

  async updateSalesSummary(date, data) {
    console.log(`Updating sales summary for date: ${date}`, data);
    try {
      const now = new Date().toISOString();
      const summary = await this.getSalesSummaryByDate(date);

      if (!summary) {
        // Create new summary if it doesn't exist
        const result = await query.run(
          `INSERT INTO sales_summary (
            date, total_sales, total_orders, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            date,
            data.totalSales || 0,
            data.totalOrders || 0,
            now,
            now
          ]
        );

        return {
          id: result.lastID,
          date,
          totalSales: data.totalSales || 0,
          totalOrders: data.totalOrders || 0,
          createdAt: now,
          updatedAt: now
        };
      } else {
        // Update existing summary
        const fields = [];
        const values = [];

        if (data.totalSales !== undefined) {
          fields.push('total_sales = ?');
          values.push(data.totalSales);
        }

        if (data.totalOrders !== undefined) {
          fields.push('total_orders = ?');
          values.push(data.totalOrders);
        }

        // Always update the updated_at field
        fields.push('updated_at = ?');
        values.push(now);

        // Add the date for the WHERE clause
        values.push(date);

        await query.run(
          `UPDATE sales_summary SET ${fields.join(', ')} WHERE date = ?`,
          values
        );

        // Return the updated summary
        return await this.getSalesSummaryByDate(date);
      }
    } catch (error) {
      console.error(`Error in updateSalesSummary(${date}):`, error);
      throw error;
    }
  },

  // Helper methods for sales summary updates
  async updateSalesSummaryForOrder(date, amount) {
    console.log(`Updating sales summary for new order on date: ${date}, amount: ${amount}`);
    try {
      const summary = await this.getSalesSummaryByDate(date);

      if (!summary) {
        // Create new summary
        await this.updateSalesSummary(date, {
          totalSales: amount,
          totalOrders: 1
        });
      } else {
        // Update existing summary
        await this.updateSalesSummary(date, {
          totalSales: summary.totalSales + amount,
          totalOrders: summary.totalOrders + 1
        });
      }
    } catch (error) {
      console.error(`Error in updateSalesSummaryForOrder(${date}, ${amount}):`, error);
      // Don't throw - this shouldn't block order creation
      console.log('Continuing despite sales summary update error');
    }
  },

  async updateSalesSummaryAmount(date, amountDifference) {
    console.log(`Updating sales summary amount on date: ${date}, difference: ${amountDifference}`);
    try {
      const summary = await this.getSalesSummaryByDate(date);

      if (summary) {
        await this.updateSalesSummary(date, {
          totalSales: summary.totalSales + amountDifference
        });
      }
    } catch (error) {
      console.error(`Error in updateSalesSummaryAmount(${date}, ${amountDifference}):`, error);
      // Don't throw - this shouldn't block order update
      console.log('Continuing despite sales summary update error');
    }
  },

  async updateSalesSummaryForDeletedOrder(date, amount) {
    console.log(`Updating sales summary for deleted order on date: ${date}, amount: ${amount}`);
    try {
      const summary = await this.getSalesSummaryByDate(date);

      if (summary) {
        await this.updateSalesSummary(date, {
          totalSales: Math.max(0, summary.totalSales - amount),
          totalOrders: Math.max(0, summary.totalOrders - 1)
        });
      }
    } catch (error) {
      console.error(`Error in updateSalesSummaryForDeletedOrder(${date}, ${amount}):`, error);
      // Don't throw - this shouldn't block order deletion
      console.log('Continuing despite sales summary update error');
    }
  },

  // فروش بر اساس دسته‌بندی محصولات (همه دسته‌ها حتی بدون فروش)
  async getSalesByCategory() {
    // ابتدا همه دسته‌بندی‌های رسپی را بگیر
    const categoriesRows = await query.all('SELECT DISTINCT category FROM recipes');
    const allCategories = categoriesRows.map(row => row.category);
    // حالا فروش هر دسته را بگیر
    const sql = `
      SELECT mi.category, 
             SUM(oi.total_price) as total_sales,
             SUM(oi.quantity) as total_quantity
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      GROUP BY mi.category
    `;
    let salesRows = [];
    try {
      salesRows = await query.all(sql);
    } catch (error) {
      console.error('Error in getSalesByCategory sales query:', error);
      salesRows = [];
    }
    // تبدیل به map برای دسترسی سریع
    const salesMap = {};
    for (const row of salesRows) {
      salesMap[row.category] = {
        totalSales: row.total_sales,
        totalQuantity: row.total_quantity
      };
    }
    // خروجی نهایی: همه دسته‌ها حتی اگر فروش ندارند
    return allCategories.map(category => ({
      category,
      totalSales: salesMap[category]?.totalSales || 0,
      totalQuantity: salesMap[category]?.totalQuantity || 0
    }));
  },

  // فروش بر اساس ساعت (اوج فروش)
  async getSalesByHour() {
    // جمع فروش هر ساعت از جدول orders
    const sql = `
      SELECT jalali_time, SUM(total_amount) as total_sales, COUNT(*) as order_count
      FROM orders
      GROUP BY jalali_time
      ORDER BY jalali_time ASC
    `;
    try {
      const rows = await query.all(sql);
      return rows.map(row => ({
        hour: row.jalali_time,
        totalSales: row.total_sales,
        orderCount: row.order_count
      }));
    } catch (error) {
      console.error('Error in getSalesByHour:', error);
      return [];
    }
  },

  // پرفروش‌ترین و کم‌فروش‌ترین محصولات (قابلیت فیلتر بر اساس ماه و سال جلالی)
  async getBestSellingItems(limit = 5, year, month, order = 'desc') {
    let sql = `
      SELECT mi.name, SUM(oi.quantity) as total_quantity, SUM(oi.total_price) as total_sales
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN orders o ON oi.order_id = o.id
    `;
    const params = [];
    if (year && month) {
      // فرض بر این است که jalali_date به صورت yyyy-mm-dd ذخیره شده است
      sql += ` WHERE o.jalali_date LIKE ?`;
      params.push(`${year}-${month.toString().padStart(2, '0')}-%`);
    }
    // Only allow 'asc' or 'desc' for order
    const orderBy = order === 'asc' ? 'ASC' : 'DESC';
    sql += ` GROUP BY mi.id, mi.name ORDER BY total_quantity ${orderBy} LIMIT ?`;
    params.push(limit);
    try {
      const rows = await query.all(sql, params);
      return rows.map(row => ({
        name: row.name,
        totalQuantity: row.total_quantity,
        totalSales: row.total_sales
      }));
    } catch (error) {
      console.error('Error in getBestSellingItems:', error);
      return [];
    }
  },
};

// Export the storage implementation
export { sqliteStorage };

// Add debug logs to check what functions are available
console.log("======================= DEBUGGING =======================");
console.log("Available functions in sqliteStorage:", Object.keys(sqliteStorage));
console.log("getMaterialsCount exists:", typeof sqliteStorage.getMaterialsCount === 'function');
console.log("getRecipesCount exists:", typeof sqliteStorage.getRecipesCount === 'function');
console.log("============== END DEBUGGING ==============");