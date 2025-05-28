import { 
  Material, 
  InsertMaterial, 
  Recipe,
  InsertRecipe,
  MenuItem,
  InsertMenuItem,
  Activity,
  InsertActivity,
  RecipeIngredient,
  InsertRecipeIngredient,
  User,
  InsertUser,
  Order,
  InsertOrder,
  OrderItem,
  InsertOrderItem,
  SalesSummary,
  InsertSalesSummary,
  users,
  materials,
  recipes,
  recipeIngredients,
  menuItems,
  activities,
  orderItems,
  orders,
  salesSummary
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, lt, gt, count } from "drizzle-orm";
import { sqliteStorage } from './storage-sqlite.js';

// Re-export the SQLite storage implementation
export const storage = sqliteStorage;

// Debug log to check what's being exported
console.log("Storage export check:", storage === sqliteStorage);
console.log("Storage functions:", Object.keys(storage));
console.log("getMaterialsCount exists on export:", typeof storage.getMaterialsCount === 'function');

// Add TypeScript interface compatibility to satisfy type checking in routes.ts
export interface IStorage {
  // Materials
  getMaterial(id: number): Promise<any>;
  getMaterials(): Promise<any[]>;
  createMaterial(material: any): Promise<any>;
  updateMaterial(id: number, material: any): Promise<any>;
  deleteMaterial(id: number): Promise<boolean>;
  
  // Stats
  getMaterialsCount(): Promise<number>;
  getRecipesCount(): Promise<number>;
  getMenuItemsCount(): Promise<number>;
  getMonthlySales(): Promise<number>;
  
  // Activities
  getActivities(): Promise<any[]>;
  createActivity(activity: any): Promise<any>;
  
  // Orders
  getOrder(id: number): Promise<any>;
  getOrders(): Promise<any[]>;
  getOrderWithItems(id: number): Promise<any>;
  createOrder(order: any): Promise<any>;
  updateOrder(id: number, order: any): Promise<any>;
  deleteOrder(id: number): Promise<boolean>;
  
  // Order Items
  getOrderItems(orderId: number): Promise<any[]>;
  addOrderItem(orderItem: any): Promise<any>;
  updateOrderItem(id: number, orderItem: any): Promise<any>;
  removeOrderItem(id: number): Promise<boolean>;
  
  // Sales Summary
  getSalesSummary(): Promise<any[]>;
  getSalesSummaryByDate(date: string): Promise<any>;
  updateSalesSummary(date: string, data: any): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private materials: Map<number, Material>;
  private recipes: Map<number, Recipe>;
  private recipeIngredients: Map<number, RecipeIngredient>;
  private menuItems: Map<number, MenuItem>;
  private activities: Map<number, Activity>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private salesSummaries: Map<string, SalesSummary>;
  
  private currentUserId: number;
  private currentMaterialId: number;
  private currentRecipeId: number;
  private currentRecipeIngredientId: number;
  private currentMenuItemId: number;
  private currentActivityId: number;
  private currentOrderId: number;
  private currentOrderItemId: number;
  private currentSalesSummaryId: number;

  constructor() {
    this.users = new Map();
    this.materials = new Map();
    this.recipes = new Map();
    this.recipeIngredients = new Map();
    this.menuItems = new Map();
    this.activities = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.salesSummaries = new Map();
    
    this.currentUserId = 1;
    this.currentMaterialId = 1;
    this.currentRecipeId = 1;
    this.currentRecipeIngredientId = 1;
    this.currentMenuItemId = 1;
    this.currentActivityId = 1;
    this.currentOrderId = 1;
    this.currentOrderItemId = 1;
    this.currentSalesSummaryId = 1;
    
    // Add some sample data
    this.initSampleData();
  }

  // User methods (keeping original)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Materials methods
  async getMaterial(id: number): Promise<Material | undefined> {
    return this.materials.get(id);
  }
  
  async getMaterials(): Promise<Material[]> {
    return Array.from(this.materials.values());
  }
  
  async createMaterial(material: InsertMaterial): Promise<Material> {
    const id = this.currentMaterialId++;
    const now = new Date();
    const newMaterial: Material = {
      ...material,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.materials.set(id, newMaterial);
    
    // Log activity
    await this.createActivity({
      type: 'add',
      entity: 'material',
      entityId: id,
      entityName: material.name,
      description: `افزودن ماده اولیه جدید:`,
      userId: 1
    });
    
    return newMaterial;
  }
  
  async updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined> {
    const existingMaterial = this.materials.get(id);
    if (!existingMaterial) return undefined;
    
    const updatedMaterial: Material = {
      ...existingMaterial,
      ...material,
      updatedAt: new Date()
    };
    this.materials.set(id, updatedMaterial);
    
    // Log activity
    await this.createActivity({
      type: 'edit',
      entity: 'material',
      entityId: id,
      entityName: updatedMaterial.name,
      description: `ویرایش ماده اولیه:`,
      userId: 1
    });
    
    return updatedMaterial;
  }
  
  async deleteMaterial(id: number): Promise<boolean> {
    const material = this.materials.get(id);
    if (!material) return false;
    
    const deleted = this.materials.delete(id);
    
    if (deleted) {
      // Log activity
      await this.createActivity({
        type: 'delete',
        entity: 'material',
        entityId: id,
        entityName: material.name,
        description: `حذف ماده اولیه:`,
        userId: 1
      });
    }
    
    return deleted;
  }
  
  // Recipe methods
  async getRecipe(id: number): Promise<Recipe | undefined> {
    return this.recipes.get(id);
  }
  
  async getRecipes(): Promise<Recipe[]> {
    return Array.from(this.recipes.values());
  }
  
  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const id = this.currentRecipeId++;
    const now = new Date();
    const newRecipe: Recipe = {
      ...recipe,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.recipes.set(id, newRecipe);
    
    // Log activity
    await this.createActivity({
      type: 'add',
      entity: 'recipe',
      entityId: id,
      entityName: recipe.name,
      description: `افزودن رسپی جدید:`,
      userId: 1
    });
    
    return newRecipe;
  }
  
  async updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const existingRecipe = this.recipes.get(id);
    if (!existingRecipe) return undefined;
    
    const updatedRecipe: Recipe = {
      ...existingRecipe,
      ...recipe,
      updatedAt: new Date()
    };
    this.recipes.set(id, updatedRecipe);
    
    // Log activity
    await this.createActivity({
      type: 'edit',
      entity: 'recipe',
      entityId: id,
      entityName: updatedRecipe.name,
      description: `ویرایش رسپی:`,
      userId: 1
    });
    
    return updatedRecipe;
  }
  
  async deleteRecipe(id: number): Promise<boolean> {
    const recipe = this.recipes.get(id);
    if (!recipe) return false;
    
    const deleted = this.recipes.delete(id);
    
    if (deleted) {
      // Log activity
      await this.createActivity({
        type: 'delete',
        entity: 'recipe',
        entityId: id,
        entityName: recipe.name,
        description: `حذف رسپی:`,
        userId: 1
      });
      
      // Also delete all recipe ingredients
      for (const [key, value] of this.recipeIngredients.entries()) {
        if (value.recipeId === id) {
          this.recipeIngredients.delete(key);
        }
      }
    }
    
    return deleted;
  }
  
  // Recipe Ingredients methods
  async getRecipeIngredients(recipeId: number): Promise<RecipeIngredient[]> {
    console.log(`MemStorage: Getting ingredients for recipe ID ${recipeId}`);
    const ingredients = Array.from(this.recipeIngredients.values())
      .filter(ingredient => ingredient.recipeId === recipeId);
    console.log(`MemStorage: Found ${ingredients.length} ingredients`);
    return ingredients;
  }
  
  async addIngredientToRecipe(recipeIngredient: InsertRecipeIngredient): Promise<RecipeIngredient> {
    const id = this.currentRecipeIngredientId++;
    const newRecipeIngredient: RecipeIngredient = {
      ...recipeIngredient,
      id
    };
    this.recipeIngredients.set(id, newRecipeIngredient);
    
    // Update recipe cost
    await this.updateRecipeCost(recipeIngredient.recipeId);
    
    return newRecipeIngredient;
  }
  
  async updateRecipeIngredient(id: number, data: Partial<InsertRecipeIngredient>): Promise<RecipeIngredient | undefined> {
    const existingIngredient = this.recipeIngredients.get(id);
    if (!existingIngredient) return undefined;
    
    const updatedIngredient: RecipeIngredient = {
      ...existingIngredient,
      ...data
    };
    this.recipeIngredients.set(id, updatedIngredient);
    
    // Update recipe cost
    await this.updateRecipeCost(updatedIngredient.recipeId);
    
    return updatedIngredient;
  }
  
  async removeIngredientFromRecipe(id: number): Promise<boolean> {
    const ingredient = this.recipeIngredients.get(id);
    if (!ingredient) return false;
    
    const recipeId = ingredient.recipeId;
    const deleted = this.recipeIngredients.delete(id);
    
    if (deleted) {
      // Update recipe cost
      await this.updateRecipeCost(recipeId);
    }
    
    return deleted;
  }
  
  async updateRecipeIngredients(recipeId: number, ingredients: Partial<InsertRecipeIngredient>[]): Promise<RecipeIngredient[]> {
    console.log(`MemStorage: Updating ingredients for recipe ID ${recipeId}`);
    console.log('MemStorage: Received ingredients:', JSON.stringify(ingredients));
    
    // First, delete all existing ingredients for this recipe
    const idsToDelete: number[] = [];
    this.recipeIngredients.forEach((ingredient, id) => {
      if (ingredient.recipeId === recipeId) {
        idsToDelete.push(id);
      }
    });
    
    console.log(`MemStorage: Deleting ${idsToDelete.length} existing ingredients`);
    
    // Delete the ingredients
    for (const id of idsToDelete) {
      this.recipeIngredients.delete(id);
    }
    
    console.log(`MemStorage: Adding ${ingredients.length} new ingredients`);
    
    // Then, insert all new ingredients
    for (const ingredient of ingredients) {
      console.log('MemStorage: Adding ingredient:', JSON.stringify(ingredient));
      if (ingredient.materialId === undefined || ingredient.amount === undefined) {
        console.error('MemStorage: Invalid ingredient data:', ingredient);
        throw new Error(`Invalid ingredient data: materialId or amount is undefined`);
      }
      
      await this.addIngredientToRecipe({
        recipeId,
        materialId: ingredient.materialId!,
        amount: ingredient.amount!
      });
    }
    
    // Return the updated ingredients
    const updatedIngredients = await this.getRecipeIngredients(recipeId);
    console.log(`MemStorage: Returning ${updatedIngredients.length} updated ingredients`);
    return updatedIngredients;
  }
  
  // Helper method to update recipe cost based on ingredients
  private async updateRecipeCost(recipeId: number): Promise<void> {
    const recipe = this.recipes.get(recipeId);
    if (!recipe) return;
    
    const ingredients = await this.getRecipeIngredients(recipeId);
    let totalCost = 0;
    
    for (const ingredient of ingredients) {
      const material = this.materials.get(ingredient.materialId);
      if (material) {
        // Calculate cost based on amount and material price
        totalCost += (material.price * ingredient.amount / 1000); // Assuming amount is in grams
      }
    }
    
    // No need to update costPrice since we've replaced it with priceCoefficient
    recipe.updatedAt = new Date();
    this.recipes.set(recipeId, recipe);
    
    // Log activity
    await this.createActivity({
      type: 'calculate',
      entity: 'recipe',
      entityId: recipeId,
      entityName: recipe.name,
      description: `محاسبه مجدد قیمت مواد اولیه رسپی:`,
      userId: 1
    });
  }
  
  // Menu Items methods
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }
  
  async getMenuItems(): Promise<MenuItem[]> {
    const items = await db.select().from(menuItems);
    const recipes = await db.select().from(recipes);
    const recipeIngredients = await db.select().from(recipeIngredients);
    const materials = await db.select().from(materials);

    // Map recipe ingredients to their materials
    const ingredientsMap = new Map<number, RecipeIngredient[]>();
    recipeIngredients.forEach(ri => {
      const material = materials.find(m => m.id === ri.materialId);
      if (material) {
        const ingredient: RecipeIngredient = {
          id: ri.id,
          recipeId: ri.recipeId,
          materialId: ri.materialId,
          materialName: material.name,
          amount: ri.amount,
          unit: material.unit || 'گرم'
        };
        if (!ingredientsMap.has(ri.recipeId)) {
          ingredientsMap.set(ri.recipeId, []);
        }
        ingredientsMap.get(ri.recipeId)?.push(ingredient);
      }
    });

    // Map recipes to their ingredients
    const recipesMap = new Map<number, Recipe>();
    recipes.forEach(recipe => {
      const ingredients = ingredientsMap.get(recipe.id) || [];
      recipesMap.set(recipe.id, {
        ...recipe,
        ingredients
      });
    });

    // Map menu items to their recipes
    return items.map(item => ({
      ...item,
      recipe: recipesMap.get(item.recipeId)
    }));
  }
  
  async createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem> {
    const id = this.currentMenuItemId++;
    const now = new Date();
    const newMenuItem: MenuItem = {
      ...menuItem,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.menuItems.set(id, newMenuItem);
    
    // Log activity
    await this.createActivity({
      type: 'add',
      entity: 'menu',
      entityId: id,
      entityName: menuItem.name,
      description: `افزودن آیتم منو جدید:`,
      userId: 1
    });
    
    return newMenuItem;
  }
  
  async updateMenuItem(id: number, menuItem: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const existingMenuItem = this.menuItems.get(id);
    if (!existingMenuItem) return undefined;
    
    const updatedMenuItem: MenuItem = {
      ...existingMenuItem,
      ...menuItem,
      updatedAt: new Date()
    };
    this.menuItems.set(id, updatedMenuItem);
    
    // Log activity
    await this.createActivity({
      type: 'edit',
      entity: 'menu',
      entityId: id,
      entityName: updatedMenuItem.name,
      description: `ویرایش آیتم منو:`,
      userId: 1
    });
    
    return updatedMenuItem;
  }
  
  async deleteMenuItem(id: number): Promise<boolean> {
    const menuItem = this.menuItems.get(id);
    if (!menuItem) return false;
    
    const deleted = this.menuItems.delete(id);
    
    if (deleted) {
      // Log activity
      await this.createActivity({
        type: 'delete',
        entity: 'menu',
        entityId: id,
        entityName: menuItem.name,
        description: `حذف آیتم منو:`,
        userId: 1
      });
    }
    
    return deleted;
  }
  
  // Activities methods
  async getActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const newActivity: Activity = {
      ...activity,
      id,
      createdAt: new Date()
    };
    this.activities.set(id, newActivity);
    return newActivity;
  }
  
  // Stats methods
  async getMaterialsCount(): Promise<number> {
    return this.materials.size;
  }
  
  async getRecipesCount(): Promise<number> {
    return this.recipes.size;
  }
  
  async getMenuItemsCount(): Promise<number> {
    return this.menuItems.size;
  }
  
  async getMonthlySales(): Promise<number> {
    try {
      console.log('Getting monthly sales using direct SQL...');
      // Calculate the total amount of orders for the current month
      const now = new Date();
      const month = now.getMonth() + 1; // January is 0, so add 1
      const year = now.getFullYear();
      
      // Using SQL to get sum directly, format varies by database
      // This works for SQLite
      const query = `
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM orders
        WHERE strftime('%m', created_at) = ? 
        AND strftime('%Y', created_at) = ?
      `;
      
      return await new Promise((resolve, reject) => {
        // Format month and year as strings with padding
        const monthStr = month.toString().padStart(2, '0');
        const yearStr = year.toString();
        
        db.get(query, [monthStr, yearStr], (err: any, row: { total: number }) => {
          if (err) {
            console.error('Error in getMonthlySales() SQL query:', err);
            reject(err);
          } else {
            // Convert to millions
            resolve(row.total / 1000000);
          }
        });
      });
    } catch (error) {
      console.error('Error in getMonthlySales():', error);
      throw error;
    }
  }
  
  async getOrdersCount(): Promise<number> {
    try {
      console.log('Getting orders count using direct SQL...');
      const query = "SELECT COUNT(*) as count FROM orders";
      return await new Promise((resolve, reject) => {
        db.get(query, [], (err: any, row: { count: number }) => {
          if (err) {
            console.error('Error in getOrdersCount() SQL query:', err);
            reject(err);
          } else {
            resolve(row.count);
          }
        });
      });
    } catch (error) {
      console.error('Error in getOrdersCount():', error);
      throw error;
    }
  }
  
  // Orders methods
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getOrderWithItems(id: number): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    // Get all order items for this order
    const items = await this.getOrderItems(id);
    
    return {
      ...order,
      items
    };
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    try {
      // Check if order number already exists
      const existingOrderCheck = await db.select({ count: count() })
        .from(orders)
        .where(eq(orders.orderNumber, order.orderNumber));
        
      if (existingOrderCheck[0].count > 0) {
        throw new Error(`سفارشی با شماره ${order.orderNumber} قبلاً ثبت شده است`);
      }
      
      const [newOrder] = await db.insert(orders)
        .values({
          ...order,
          createdAt: new Date()
        })
        .returning();
      
      // Log activity
      await this.createActivity({
        type: 'add',
        entity: 'order',
        entityId: newOrder.id,
        entityName: newOrder.orderNumber,
        description: `ثبت سفارش جدید:`,
        userId: 1
      });
      
      // Update sales summary for the day
      await this.updateSalesSummaryForOrder(newOrder.jalaliDate, newOrder.totalAmount);
      
      return newOrder;
    } catch (error) {
      console.error('Error in createOrder:', error);
      // Enhance the error message for client
      if (error instanceof Error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          throw new Error(`سفارشی با شماره ${order.orderNumber} قبلاً ثبت شده است`);
        }
        throw error;
      }
      throw new Error('خطای پایگاه داده در ثبت سفارش');
    }
  }
  
  async updateOrder(id: number, orderData: Partial<InsertOrder>): Promise<Order | undefined> {
    try {
      const [existingOrder] = await db.select().from(orders).where(eq(orders.id, id));
      if (!existingOrder) return undefined;
      
      const oldAmount = existingOrder.totalAmount;
      
      // Don't include updatedAt as it's not in the schema
      const [updatedOrder] = await db.update(orders)
        .set(orderData)
        .where(eq(orders.id, id))
        .returning();
      
      // Log activity
      await this.createActivity({
        type: 'edit',
        entity: 'order',
        entityId: id,
        entityName: updatedOrder.orderNumber,
        description: `ویرایش سفارش:`,
        userId: 1
      });
      
      // If total amount has changed, update sales summary
      if (orderData.totalAmount && orderData.totalAmount !== oldAmount) {
        const amountDifference = orderData.totalAmount - oldAmount;
        await this.updateSalesSummaryAmount(updatedOrder.jalaliDate, amountDifference);
      }
      
      return updatedOrder;
    } catch (error) {
      console.error(`Error in updateOrder(id: ${id}):`, error);
      if (error instanceof Error) {
        throw new Error(`خطا در به‌روزرسانی سفارش: ${error.message}`);
      }
      throw new Error('خطای داخلی در به‌روزرسانی سفارش');
    }
  }
  
  async deleteOrder(id: number): Promise<boolean> {
    const order = this.orders.get(id);
    if (!order) return false;
    
    // Before deleting, get all items to delete them too
    const items = await this.getOrderItems(id);
    
    const deleted = this.orders.delete(id);
    
    if (deleted) {
      // Delete all related order items
      for (const item of items) {
        this.orderItems.delete(item.id);
      }
      
      // Log activity
      await this.createActivity({
        type: 'delete',
        entity: 'sale',
        entityId: id,
        entityName: `سفارش #${order.orderNumber}`,
        description: `حذف سفارش:`,
        userId: 1
      });
      
      // Update sales summary (reduce total amount and count)
      await this.updateSalesSummaryForDeletedOrder(order.jalaliDate, order.totalAmount);
    }
    
    return deleted;
  }
  
  // Order items methods
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const recipes = await db.select().from(recipes);
    const recipeIngredients = await db.select().from(recipeIngredients);
    const materials = await db.select().from(materials);

    // Map recipe ingredients to their materials
    const ingredientsMap = new Map<number, RecipeIngredient[]>();
    recipeIngredients.forEach(ri => {
      const material = materials.find(m => m.id === ri.materialId);
      if (material) {
        const ingredient: RecipeIngredient = {
          id: ri.id,
          recipeId: ri.recipeId,
          materialId: ri.materialId,
          materialName: material.name,
          amount: ri.amount,
          unit: material.unit || 'گرم'
        };
        if (!ingredientsMap.has(ri.recipeId)) {
          ingredientsMap.set(ri.recipeId, []);
        }
        ingredientsMap.get(ri.recipeId)?.push(ingredient);
      }
    });

    // Map recipes to their ingredients
    const recipesMap = new Map<number, Recipe>();
    recipes.forEach(recipe => {
      const ingredients = ingredientsMap.get(recipe.id) || [];
      recipesMap.set(recipe.id, {
        ...recipe,
        ingredients
      });
    });

    // Map order items to their recipes
    return items.map(item => {
      const menuItem = this.menuItems.get(item.menuItemId);
      return {
        ...item,
        recipeId: menuItem?.recipeId,
        recipe: menuItem?.recipeId ? recipesMap.get(menuItem.recipeId) : undefined
      };
    });
  }
  
  async addOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    try {
      // Verify that the order exists
      const [orderExists] = await db.select({ count: count() })
        .from(orders)
        .where(eq(orders.id, orderItem.orderId));
        
      if (orderExists.count === 0) {
        throw new Error(`سفارشی با شناسه ${orderItem.orderId} وجود ندارد`);
      }
      
      const [newOrderItem] = await db.insert(orderItems)
        .values(orderItem)
        .returning();
      
      return newOrderItem;
    } catch (error) {
      console.error('Error in addOrderItem:', error);
      // Enhance the error message for client
      if (error instanceof Error) {
        if (error.message.includes('FOREIGN KEY constraint failed')) {
          throw new Error(`سفارشی با شناسه ${orderItem.orderId} وجود ندارد یا منوی آیتم با شناسه ${orderItem.menuItemId} نامعتبر است`);
        }
        throw error;
      }
      throw new Error('خطای پایگاه داده در ثبت آیتم سفارش');
    }
  }
  
  async updateOrderItem(id: number, orderItem: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const existingItem = this.orderItems.get(id);
    if (!existingItem) return undefined;
    
    // If we're updating quantity or price, we need to update the totalPrice field
    let updatedPrice = existingItem.price;
    let updatedQuantity = existingItem.quantity;
    
    if (orderItem.price !== undefined) {
      updatedPrice = orderItem.price;
    }
    
    if (orderItem.quantity !== undefined) {
      updatedQuantity = orderItem.quantity;
    }
    
    const updatedTotalPrice = updatedPrice * updatedQuantity;
    
    const updatedOrderItem: OrderItem = {
      ...existingItem,
      ...orderItem,
      totalPrice: updatedTotalPrice
    };
    
    this.orderItems.set(id, updatedOrderItem);
    return updatedOrderItem;
  }
  
  async removeOrderItem(id: number): Promise<boolean> {
    return this.orderItems.delete(id);
  }
  
  // Sales summary methods
  async getSalesSummary(): Promise<SalesSummary[]> {
    return Array.from(this.salesSummaries.values())
      .sort((a, b) => {
        // Sort by date descending (most recent first)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }
  
  async getSalesSummaryByDate(date: string): Promise<SalesSummary | undefined> {
    return this.salesSummaries.get(date);
  }
  
  async updateSalesSummary(date: string, data: Partial<InsertSalesSummary>): Promise<SalesSummary | undefined> {
    const existingSummary = this.salesSummaries.get(date);
    
    if (!existingSummary) {
      // Create a new summary if it doesn't exist
      const id = this.currentSalesSummaryId++;
      const now = new Date();
      const newSummary: SalesSummary = {
        id,
        date,
        totalSales: data.totalSales || 0,
        totalOrders: data.totalOrders || 0,
        createdAt: now,
        updatedAt: now
      };
      this.salesSummaries.set(date, newSummary);
      return newSummary;
    } else {
      // Update existing summary
      const updatedSummary: SalesSummary = {
        ...existingSummary,
        ...data,
        updatedAt: new Date()
      };
      this.salesSummaries.set(date, updatedSummary);
      return updatedSummary;
    }
  }
  
  // Helper method to update sales summary when an order is created
  private async updateSalesSummaryForOrder(date: string, amount: number): Promise<void> {
    const summary = this.salesSummaries.get(date);
    
    if (!summary) {
      // Create a new summary
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
  }
  
  // Helper method to update sales summary when an order is updated
  private async updateSalesSummaryAmount(date: string, amountDifference: number): Promise<void> {
    const summary = this.salesSummaries.get(date);
    
    if (summary) {
      await this.updateSalesSummary(date, {
        totalSales: summary.totalSales + amountDifference
      });
    }
  }
  
  // Helper method to update sales summary when an order is deleted
  private async updateSalesSummaryForDeletedOrder(date: string, amount: number): Promise<void> {
    const summary = this.salesSummaries.get(date);
    
    if (summary) {
      // Ensure we don't go below zero
      const newTotalSales = Math.max(0, summary.totalSales - amount);
      const newTotalOrders = Math.max(0, summary.totalOrders - 1);
      
      await this.updateSalesSummary(date, {
        totalSales: newTotalSales,
        totalOrders: newTotalOrders
      });
    }
  }
  
  // Initialize sample data
  private initSampleData() {
    // Sample materials
    const materials = [
      { name: "شیر پرچرب", category: "لبنیات", price: 35000, unit: "لیتر", stock: 25, description: "شیر پرچرب با درصد چربی ۳.۵٪" },
      { name: "قهوه عربیکا", category: "قهوه", price: 280000, unit: "کیلوگرم", stock: 8, description: "قهوه عربیکا اتیوپی" },
      { name: "شکلات تخته‌ای تلخ", category: "شیرینی‌جات", price: 120000, unit: "کیلوگرم", stock: 3, description: "شکلات تلخ ۷۰٪" },
      { name: "پودر دارچین", category: "ادویه‌جات", price: 80000, unit: "کیلوگرم", stock: 1, description: "پودر دارچین اصل" }
    ];
    
    materials.forEach(material => {
      const id = this.currentMaterialId++;
      const now = new Date();
      this.materials.set(id, {
        ...material,
        id,
        createdAt: now,
        updatedAt: now
      });
    });
    
    // Sample recipes
    const recipes = [
      { name: "اسپرسو", category: "نوشیدنی داغ", costPrice: 15000, sellPrice: 45000, description: "قهوه اسپرسو پایه" },
      { name: "کاپوچینو", category: "نوشیدنی داغ", costPrice: 25000, sellPrice: 65000, description: "اسپرسو با شیر بخارپز شده و کف شیر" },
      { name: "موکا", category: "نوشیدنی داغ", costPrice: 35000, sellPrice: 75000, description: "اسپرسو با شیر بخارپز شده و شکلات" }
    ];
    
    recipes.forEach(recipe => {
      const id = this.currentRecipeId++;
      const now = new Date();
      this.recipes.set(id, {
        ...recipe,
        id,
        createdAt: now,
        updatedAt: now
      });
    });
    
    // Sample activities
    const activities = [
      { type: 'add', entity: 'material', entityId: 1, entityName: 'شیر', description: 'افزودن ماده اولیه جدید:', userId: 1 },
      { type: 'edit', entity: 'material', entityId: 2, entityName: 'قهوه عربیکا', description: 'ویرایش قیمت ماده اولیه:', userId: 1 },
      { type: 'add', entity: 'recipe', entityId: 3, entityName: 'لاته وانیل', description: 'افزودن رسپی جدید:', userId: 1 },
      { type: 'calculate', entity: 'menu', entityId: null, entityName: null, description: 'محاسبه مجدد قیمت منو', userId: 1 }
    ];
    
    // Add activities with different timestamps for more realistic data
    let daysAgo = 0;
    activities.forEach(activity => {
      const id = this.currentActivityId++;
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(Math.floor(Math.random() * 12) + 8); // Between 8am and 8pm
      this.activities.set(id, {
        ...activity,
        id,
        createdAt: date
      });
      daysAgo += 1;
    });
  }
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Materials
  async getMaterial(id: number): Promise<Material | undefined> {
    try {
      console.log(`Fetching material with id ${id} using direct SQL...`);
      const query = "SELECT * FROM materials WHERE id = ?";
      return await new Promise((resolve, reject) => {
        db.get(query, [id], (err: any, row: Material) => {
          if (err) {
            console.error(`Error in getMaterial(${id}) SQL query:`, err);
            reject(err);
          } else {
            resolve(row || undefined);
          }
        });
      });
    } catch (error) {
      console.error(`Error in getMaterial(${id}):`, error);
      throw error;
    }
  }

  async getMaterials(): Promise<Material[]> {
    try {
      console.log('Fetching materials from database using direct SQL...');
      // Make sure to get exactly 59 items with consistent sorting
      const query = "SELECT * FROM materials ORDER BY id LIMIT 59";
      return await new Promise((resolve, reject) => {
        db.all(query, [], (err: any, rows: any[]) => {
          if (err) {
            console.error('Error in getMaterials() SQL query:', err);
            reject(err);
          } else {
            console.log(`Successfully fetched ${rows.length} materials from database`);
            // Log the first few materials to check data format
            if (rows.length > 0) {
              console.log('First material sample:', JSON.stringify(rows[0], null, 2));
              console.log('Material columns:', Object.keys(rows[0]).join(', '));
            }
            resolve(rows as Material[]);
          }
        });
      });
    } catch (error) {
      console.error('Error in getMaterials():', error);
      throw error;
    }
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const now = new Date();
    
    // Check if we're using SQLite
    if (process.env.USE_SQLITE === 'true') {
      console.log('Using SQLite createMaterial implementation');
      
      // Import the SQLite specific storage implementation
      const { sqlite, db } = await import('./db.sqlite');
      
      return new Promise((resolve, reject) => {
        try {
          const nowIso = now.toISOString();
          db.run(
            `INSERT INTO materials (name, category, price, unit, stock, description, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              material.name,
              material.category || 'عمومی', // Default category if not provided
              material.price,
              material.unit || 'عدد', // Default unit if not provided
              material.stock || 0,
              material.description || '',
              nowIso,
              nowIso
            ],
            function(err) {
              if (err) {
                console.error('Error in createMaterial:', err);
                return reject(err);
              }
              
              const id = this.lastID;
              
              // Log activity
              db.run(
                `INSERT INTO activities (type, entity, entity_id, entity_name, description, user_id, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                  'add',
                  'material',
                  id,
                  material.name,
                  'افزودن ماده اولیه جدید:',
                  1,
                  nowIso
                ],
                (err) => {
                  if (err) {
                    console.error('Error logging activity:', err);
                    // Continue even if activity logging fails
                  }
                }
              );
              
              const newMaterial = {
                id,
                ...material,
                createdAt: nowIso,
                updatedAt: nowIso
              };
              
              resolve(newMaterial);
            }
          );
        } catch (error) {
          console.error('Unexpected error in createMaterial:', error);
          reject(error);
        }
      });
    } else {
      // Original Drizzle ORM implementation
      const [newMaterial] = await db.insert(materials)
        .values({
          ...material,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      
      // Log activity
      await this.createActivity({
        type: 'add',
        entity: 'material',
        entityId: newMaterial.id,
        entityName: material.name,
        description: `افزودن ماده اولیه جدید:`,
        userId: 1
      });
      
      return newMaterial;
    }
  }

  async updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined> {
    const [existingMaterial] = await db.select().from(materials).where(eq(materials.id, id));
    if (!existingMaterial) return undefined;
    
    const [updatedMaterial] = await db.update(materials)
      .set({
        ...material,
        updatedAt: new Date()
      })
      .where(eq(materials.id, id))
      .returning();
    
    // Log activity
    await this.createActivity({
      type: 'edit',
      entity: 'material',
      entityId: id,
      entityName: updatedMaterial.name,
      description: `ویرایش ماده اولیه:`,
      userId: 1
    });
    
    return updatedMaterial;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    if (!material) return false;
    
    const result = await db.delete(materials).where(eq(materials.id, id));
    const deleted = result.rowCount > 0;
    
    if (deleted) {
      // Log activity
      await this.createActivity({
        type: 'delete',
        entity: 'material',
        entityId: id,
        entityName: material.name,
        description: `حذف ماده اولیه:`,
        userId: 1
      });
    }
    
    return deleted;
  }

  // Recipes
  async getRecipe(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe || undefined;
  }

  async getRecipes(): Promise<Recipe[]> {
    return await db.select().from(recipes).orderBy(recipes.name);
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const now = new Date();
    const [newRecipe] = await db.insert(recipes)
      .values({
        ...recipe,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    
    // Log activity
    await this.createActivity({
      type: 'add',
      entity: 'recipe',
      entityId: newRecipe.id,
      entityName: recipe.name,
      description: `افزودن رسپی جدید:`,
      userId: 1
    });
    
    return newRecipe;
  }

  async updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const [existingRecipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    if (!existingRecipe) return undefined;
    
    const [updatedRecipe] = await db.update(recipes)
      .set({
        ...recipe,
        updatedAt: new Date()
      })
      .where(eq(recipes.id, id))
      .returning();
    
    // Log activity
    await this.createActivity({
      type: 'edit',
      entity: 'recipe',
      entityId: id,
      entityName: updatedRecipe.name,
      description: `ویرایش رسپی:`,
      userId: 1
    });
    
    return updatedRecipe;
  }

  async deleteRecipe(id: number): Promise<boolean> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    if (!recipe) return false;
    
    // Remove recipe ingredients first (due to foreign keys)
    await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
    
    // Then delete the recipe
    const result = await db.delete(recipes).where(eq(recipes.id, id));
    const deleted = result.rowCount > 0;
    
    if (deleted) {
      // Log activity
      await this.createActivity({
        type: 'delete',
        entity: 'recipe',
        entityId: id,
        entityName: recipe.name,
        description: `حذف رسپی:`,
        userId: 1
      });
    }
    
    return deleted;
  }

  // Recipe Ingredients
  async getRecipeIngredients(recipeId: number): Promise<RecipeIngredient[]> {
    console.log(`DatabaseStorage: Getting ingredients for recipe ID ${recipeId}`);
    const ingredients = await db.select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, recipeId));
    console.log(`DatabaseStorage: Found ${ingredients.length} ingredients`);
    return ingredients;
  }

  async addIngredientToRecipe(recipeIngredient: InsertRecipeIngredient): Promise<RecipeIngredient> {
    const [newIngredient] = await db.insert(recipeIngredients)
      .values(recipeIngredient)
      .returning();
    
    // Update recipe cost
    await this.updateRecipeCost(recipeIngredient.recipeId);
    
    return newIngredient;
  }

  async updateRecipeIngredient(id: number, data: Partial<InsertRecipeIngredient>): Promise<RecipeIngredient | undefined> {
    const [existingIngredient] = await db.select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.id, id));
    
    if (!existingIngredient) return undefined;
    
    const [updatedIngredient] = await db.update(recipeIngredients)
      .set(data)
      .where(eq(recipeIngredients.id, id))
      .returning();
    
    // Update recipe cost
    await this.updateRecipeCost(updatedIngredient.recipeId);
    
    return updatedIngredient;
  }

  async removeIngredientFromRecipe(id: number): Promise<boolean> {
    const [ingredient] = await db.select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.id, id));
    
    if (!ingredient) return false;
    
    const recipeId = ingredient.recipeId;
    
    const result = await db.delete(recipeIngredients)
      .where(eq(recipeIngredients.id, id));
    
    const deleted = result.rowCount > 0;
    
    if (deleted) {
      // Update recipe cost
      await this.updateRecipeCost(recipeId);
    }
    
    return deleted;
  }

  async updateRecipeIngredients(recipeId: number, ingredients: Partial<InsertRecipeIngredient>[]): Promise<RecipeIngredient[]> {
    console.log(`DatabaseStorage: Updating ingredients for recipe ID ${recipeId}`);
    console.log('DatabaseStorage: Received ingredients:', JSON.stringify(ingredients));
    
    try {
      // First, delete all existing ingredients for this recipe
      console.log('DatabaseStorage: Deleting existing ingredients');
      await db.delete(recipeIngredients)
        .where(eq(recipeIngredients.recipeId, recipeId));
      
      // Then, insert all new ingredients
      if (ingredients.length > 0) {
        console.log(`DatabaseStorage: Adding ${ingredients.length} new ingredients`);
        
        // Format ingredients and ensure all values are properly converted to numbers
        const formattedIngredients = ingredients.map(ing => {
          // Convert materialId to number (handle string, undefined, or other types)
          let materialId: number;
          if (typeof ing.materialId === 'string') {
            materialId = parseInt(ing.materialId);
          } else if (typeof ing.materialId === 'number') {
            materialId = ing.materialId;
          } else {
            console.error('DatabaseStorage: Invalid materialId:', ing.materialId);
            throw new Error(`Invalid materialId: ${ing.materialId} (type: ${typeof ing.materialId})`);
          }
          
          // Convert amount to number (handle string, undefined, or other types)
          let amount: number;
          if (typeof ing.amount === 'string') {
            amount = parseFloat(ing.amount);
          } else if (typeof ing.amount === 'number') {
            amount = ing.amount;
          } else {
            console.error('DatabaseStorage: Invalid amount:', ing.amount);
            throw new Error(`Invalid amount: ${ing.amount} (type: ${typeof ing.amount})`);
          }
          
          // Double check that we have valid numbers after conversion
          if (isNaN(materialId) || materialId <= 0) {
            console.error('DatabaseStorage: Invalid materialId after conversion:', materialId);
            throw new Error(`Invalid materialId after conversion: ${materialId}`);
          }
          
          if (isNaN(amount) || amount <= 0) {
            console.error('DatabaseStorage: Invalid amount after conversion:', amount);
            throw new Error(`Invalid amount after conversion: ${amount}`);
          }
          
          console.log(`DatabaseStorage: Formatted ingredient - materialId: ${materialId} (${typeof materialId}), amount: ${amount} (${typeof amount})`);
          
          return {
            recipeId: recipeId,
            materialId: materialId,
            amount: amount
          };
        });
        
        console.log('DatabaseStorage: Formatted ingredients for insert:', JSON.stringify(formattedIngredients));
        
        try {
          await db.insert(recipeIngredients)
            .values(formattedIngredients);
          console.log('DatabaseStorage: Successfully inserted ingredients');
        } catch (insertError) {
          console.error('DatabaseStorage: Error inserting ingredients:', insertError);
          throw insertError;
        }
      }
      
      // Update recipe cost
      await this.updateRecipeCost(recipeId);
      
      // Return the updated ingredients
      const updatedIngredients = await this.getRecipeIngredients(recipeId);
      console.log(`DatabaseStorage: Returning ${updatedIngredients.length} updated ingredients`);
      return updatedIngredients;
    } catch (error) {
      console.error('DatabaseStorage: Error in updateRecipeIngredients:', error);
      throw error;
    }
  }

  // Helper method to update recipe cost based on ingredients
  private async updateRecipeCost(recipeId: number): Promise<void> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, recipeId));
    if (!recipe) return;
    
    const ingredients = await this.getRecipeIngredients(recipeId);
    let totalCost = 0;
    
    for (const ingredient of ingredients) {
      const [material] = await db.select()
        .from(materials)
        .where(eq(materials.id, ingredient.materialId));
      
      if (material) {
        // Calculate cost based on amount and material price
        totalCost += (material.price * ingredient.amount / 1000); // Assuming amount is in grams
      }
    }
    
    // Update the recipe's updated timestamp only
    await db.update(recipes)
      .set({
        updatedAt: new Date()
      })
      .where(eq(recipes.id, recipeId));
    
    // Log activity
    await this.createActivity({
      type: 'calculate',
      entity: 'recipe',
      entityId: recipeId,
      entityName: recipe.name,
      description: `محاسبه مجدد قیمت مواد اولیه رسپی:`,
      userId: 1
    });
  }

  // Menu Items
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [menuItem] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return menuItem || undefined;
  }

  async getMenuItems(): Promise<MenuItem[]> {
    const items = await db.select().from(menuItems);
    const recipes = await db.select().from(recipes);
    const recipeIngredients = await db.select().from(recipeIngredients);
    const materials = await db.select().from(materials);

    // Map recipe ingredients to their materials
    const ingredientsMap = new Map<number, RecipeIngredient[]>();
    recipeIngredients.forEach(ri => {
      const material = materials.find(m => m.id === ri.materialId);
      if (material) {
        const ingredient: RecipeIngredient = {
          id: ri.id,
          recipeId: ri.recipeId,
          materialId: ri.materialId,
          materialName: material.name,
          amount: ri.amount,
          unit: material.unit || 'گرم'
        };
        if (!ingredientsMap.has(ri.recipeId)) {
          ingredientsMap.set(ri.recipeId, []);
        }
        ingredientsMap.get(ri.recipeId)?.push(ingredient);
      }
    });

    // Map recipes to their ingredients
    const recipesMap = new Map<number, Recipe>();
    recipes.forEach(recipe => {
      const ingredients = ingredientsMap.get(recipe.id) || [];
      recipesMap.set(recipe.id, {
        ...recipe,
        ingredients
      });
    });

    // Map menu items to their recipes
    return items.map(item => ({
      ...item,
      recipe: recipesMap.get(item.recipeId)
    }));
  }

  async createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem> {
    const now = new Date();
    const [newMenuItem] = await db.insert(menuItems)
      .values({
        ...menuItem,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    
    // Log activity
    await this.createActivity({
      type: 'add',
      entity: 'menu',
      entityId: newMenuItem.id,
      entityName: menuItem.name,
      description: `افزودن آیتم منو جدید:`,
      userId: 1
    });
    
    return newMenuItem;
  }

  async updateMenuItem(id: number, menuItem: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [existingMenuItem] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    if (!existingMenuItem) return undefined;
    
    const [updatedMenuItem] = await db.update(menuItems)
      .set({
        ...menuItem,
        updatedAt: new Date()
      })
      .where(eq(menuItems.id, id))
      .returning();
    
    // Log activity
    await this.createActivity({
      type: 'edit',
      entity: 'menu',
      entityId: id,
      entityName: updatedMenuItem.name,
      description: `ویرایش آیتم منو:`,
      userId: 1
    });
    
    return updatedMenuItem;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    const [menuItem] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    if (!menuItem) return false;
    
    const result = await db.delete(menuItems).where(eq(menuItems.id, id));
    const deleted = result.rowCount > 0;
    
    if (deleted) {
      // Log activity
      await this.createActivity({
        type: 'delete',
        entity: 'menu',
        entityId: id,
        entityName: menuItem.name,
        description: `حذف آیتم منو:`,
        userId: 1
      });
    }
    
    return deleted;
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    try {
      console.log('Fetching activities using direct SQL...');
      const query = "SELECT * FROM activities ORDER BY created_at DESC LIMIT 10";
      return await new Promise((resolve, reject) => {
        db.all(query, [], (err: any, rows: Activity[]) => {
          if (err) {
            console.error('Error in getActivities() SQL query:', err);
            reject(err);
          } else {
            console.log(`Successfully fetched ${rows.length} activities`);
            resolve(rows);
          }
        });
      });
    } catch (error) {
      console.error('Error in getActivities():', error);
      throw error;
    }
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities)
      .values({
        ...activity,
        createdAt: new Date()
      })
      .returning();
    
    return newActivity;
  }

  // Orders
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrders(): Promise<Order[]> {
    return await db.select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
  }

  async getOrderWithItems(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;
    
    // Get all order items for this order
    const items = await this.getOrderItems(id);
    
    return {
      ...order,
      items
    };
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    try {
      // Check if order number already exists
      const existingOrderCheck = await db.select({ count: count() })
        .from(orders)
        .where(eq(orders.orderNumber, order.orderNumber));
        
      if (existingOrderCheck[0].count > 0) {
        throw new Error(`سفارشی با شماره ${order.orderNumber} قبلاً ثبت شده است`);
      }
      
      const [newOrder] = await db.insert(orders)
        .values({
          ...order,
          createdAt: new Date()
        })
        .returning();
      
      // Log activity
      await this.createActivity({
        type: 'add',
        entity: 'order',
        entityId: newOrder.id,
        entityName: newOrder.orderNumber,
        description: `ثبت سفارش جدید:`,
        userId: 1
      });
      
      // Update sales summary for the day
      await this.updateSalesSummaryForOrder(newOrder.jalaliDate, newOrder.totalAmount);
      
      return newOrder;
    } catch (error) {
      console.error('Error in createOrder:', error);
      // Enhance the error message for client
      if (error instanceof Error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          throw new Error(`سفارشی با شماره ${order.orderNumber} قبلاً ثبت شده است`);
        }
        throw error;
      }
      throw new Error('خطای پایگاه داده در ثبت سفارش');
    }
  }

  async updateOrder(id: number, orderData: Partial<InsertOrder>): Promise<Order | undefined> {
    try {
      const [existingOrder] = await db.select().from(orders).where(eq(orders.id, id));
      if (!existingOrder) return undefined;
      
      const oldAmount = existingOrder.totalAmount;
      
      // Don't include updatedAt as it's not in the schema
      const [updatedOrder] = await db.update(orders)
        .set(orderData)
        .where(eq(orders.id, id))
        .returning();
      
      // Log activity
      await this.createActivity({
        type: 'edit',
        entity: 'order',
        entityId: id,
        entityName: updatedOrder.orderNumber,
        description: `ویرایش سفارش:`,
        userId: 1
      });
      
      // If total amount has changed, update sales summary
      if (orderData.totalAmount && orderData.totalAmount !== oldAmount) {
        const amountDifference = orderData.totalAmount - oldAmount;
        await this.updateSalesSummaryAmount(updatedOrder.jalaliDate, amountDifference);
      }
      
      return updatedOrder;
    } catch (error) {
      console.error(`Error in updateOrder(id: ${id}):`, error);
      if (error instanceof Error) {
        throw new Error(`خطا در به‌روزرسانی سفارش: ${error.message}`);
      }
      throw new Error('خطای داخلی در به‌روزرسانی سفارش');
    }
  }

  async deleteOrder(id: number): Promise<boolean> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return false;
    
    // Remove order items first (due to foreign keys)
    await db.delete(orderItems).where(eq(orderItems.orderId, id));
    
    // Then delete the order
    const result = await db.delete(orders).where(eq(orders.id, id));
    const deleted = result.rowCount > 0;
    
    if (deleted) {
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
    }
    
    return deleted;
  }

  // Order Items
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const recipes = await db.select().from(recipes);
    const recipeIngredients = await db.select().from(recipeIngredients);
    const materials = await db.select().from(materials);

    // Map recipe ingredients to their materials
    const ingredientsMap = new Map<number, RecipeIngredient[]>();
    recipeIngredients.forEach(ri => {
      const material = materials.find(m => m.id === ri.materialId);
      if (material) {
        const ingredient: RecipeIngredient = {
          id: ri.id,
          recipeId: ri.recipeId,
          materialId: ri.materialId,
          materialName: material.name,
          amount: ri.amount,
          unit: material.unit || 'گرم'
        };
        if (!ingredientsMap.has(ri.recipeId)) {
          ingredientsMap.set(ri.recipeId, []);
        }
        ingredientsMap.get(ri.recipeId)?.push(ingredient);
      }
    });

    // Map recipes to their ingredients
    const recipesMap = new Map<number, Recipe>();
    recipes.forEach(recipe => {
      const ingredients = ingredientsMap.get(recipe.id) || [];
      recipesMap.set(recipe.id, {
        ...recipe,
        ingredients
      });
    });

    // Map order items to their recipes
    return items.map(item => {
      const menuItem = this.menuItems.get(item.menuItemId);
      return {
        ...item,
        recipeId: menuItem?.recipeId,
        recipe: menuItem?.recipeId ? recipesMap.get(menuItem.recipeId) : undefined
      };
    });
  }

  async addOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    try {
      // Verify that the order exists
      const [orderExists] = await db.select({ count: count() })
        .from(orders)
        .where(eq(orders.id, orderItem.orderId));
        
      if (orderExists.count === 0) {
        throw new Error(`سفارشی با شناسه ${orderItem.orderId} وجود ندارد`);
      }
      
      const [newOrderItem] = await db.insert(orderItems)
        .values(orderItem)
        .returning();
      
      return newOrderItem;
    } catch (error) {
      console.error('Error in addOrderItem:', error);
      // Enhance the error message for client
      if (error instanceof Error) {
        if (error.message.includes('FOREIGN KEY constraint failed')) {
          throw new Error(`سفارشی با شناسه ${orderItem.orderId} وجود ندارد یا منوی آیتم با شناسه ${orderItem.menuItemId} نامعتبر است`);
        }
        throw error;
      }
      throw new Error('خطای پایگاه داده در ثبت آیتم سفارش');
    }
  }

  async updateOrderItem(id: number, orderItem: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const [existingOrderItem] = await db.select()
      .from(orderItems)
      .where(eq(orderItems.id, id));
    
    if (!existingOrderItem) return undefined;
    
    const [updatedOrderItem] = await db.update(orderItems)
      .set(orderItem)
      .where(eq(orderItems.id, id))
      .returning();
    
    return updatedOrderItem;
  }

  async removeOrderItem(id: number): Promise<boolean> {
    const result = await db.delete(orderItems)
      .where(eq(orderItems.id, id));
    
    return result.rowCount > 0;
  }

  // Sales Summary
  async getSalesSummary(): Promise<SalesSummary[]> {
    return await db.select()
      .from(salesSummary)
      .orderBy(desc(salesSummary.date));
  }

  async getSalesSummaryByDate(date: string): Promise<SalesSummary | undefined> {
    const [summary] = await db.select()
      .from(salesSummary)
      .where(eq(salesSummary.date, date));
    
    return summary || undefined;
  }

  async updateSalesSummary(date: string, data: Partial<InsertSalesSummary>): Promise<SalesSummary | undefined> {
    const existingSummary = await this.getSalesSummaryByDate(date);
    
    if (!existingSummary) {
      // Create new summary if it doesn't exist
      const [newSummary] = await db.insert(salesSummary)
        .values({
          date,
          totalSales: data.totalSales || 0,
          totalOrders: data.totalOrders || 0
        })
        .returning();
      
      return newSummary;
    } else {
      // Update existing summary
      const [updatedSummary] = await db.update(salesSummary)
        .set(data)
        .where(eq(salesSummary.date, date))
        .returning();
      
      return updatedSummary;
    }
  }

  // Helper methods for sales summary updates
  private async updateSalesSummaryForOrder(date: string, amount: number): Promise<void> {
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
  }

  private async updateSalesSummaryAmount(date: string, amountDifference: number): Promise<void> {
    const summary = await this.getSalesSummaryByDate(date);
    
    if (summary) {
      await this.updateSalesSummary(date, {
        totalSales: summary.totalSales + amountDifference
      });
    }
  }

  private async updateSalesSummaryForDeletedOrder(date: string, amount: number): Promise<void> {
    const summary = await this.getSalesSummaryByDate(date);
    
    if (summary) {
      await this.updateSalesSummary(date, {
        totalSales: Math.max(0, summary.totalSales - amount),
        totalOrders: Math.max(0, summary.totalOrders - 1)
      });
    }
  }
  
  // Stats
  async getMaterialsCount(): Promise<number> {
    try {
      console.log('Getting materials count...');
      const query = "SELECT COUNT(*) as count FROM materials";
      return await new Promise((resolve, reject) => {
        db.get(query, [], (err: any, row: { count: number }) => {
          if (err) {
            console.error('Error in getMaterialsCount() SQL query:', err);
            reject(err);
          } else {
            console.log(`Found ${row.count} materials in database`);
            resolve(row.count);
          }
        });
      });
    } catch (error) {
      console.error('Error in getMaterialsCount():', error);
      throw error;
    }
  }
  
  async getRecipesCount(): Promise<number> {
    try {
      console.log('Getting recipes count...');
      const query = "SELECT COUNT(*) as count FROM recipes";
      return await new Promise((resolve, reject) => {
        db.get(query, [], (err: any, row: { count: number }) => {
          if (err) {
            console.error('Error in getRecipesCount() SQL query:', err);
            reject(err);
          } else {
            console.log(`Found ${row.count} recipes in database`);
            resolve(row.count);
          }
        });
      });
    } catch (error) {
      console.error('Error in getRecipesCount():', error);
      throw error;
    }
  }
  
  async getMenuItemsCount(): Promise<number> {
    try {
      console.log('Getting menu items count using direct SQL...');
      const query = "SELECT COUNT(*) as count FROM menu_items";
      return await new Promise((resolve, reject) => {
        db.get(query, [], (err: any, row: { count: number }) => {
          if (err) {
            console.error('Error in getMenuItemsCount() SQL query:', err);
            reject(err);
          } else {
            resolve(row.count);
          }
        });
      });
    } catch (error) {
      console.error('Error in getMenuItemsCount():', error);
      throw error;
    }
  }
  
  async getMonthlySales(): Promise<number> {
    try {
      console.log('Getting monthly sales...');
      const query = `
        SELECT COALESCE(SUM(total_amount), 0) as total 
        FROM sales_summary 
        WHERE date >= date('now', 'start of month')
      `;
      return await new Promise((resolve, reject) => {
        db.get(query, [], (err: any, row: { total: number }) => {
          if (err) {
            console.error('Error in getMonthlySales() SQL query:', err);
            reject(err);
          } else {
            const totalInMillions = Math.round(row.total / 1000000);
            console.log(`Monthly sales: ${totalInMillions}M Tomans`);
            resolve(totalInMillions);
          }
        });
      });
    } catch (error) {
      console.error('Error in getMonthlySales():', error);
      throw error;
    }
  }
  
  async getOrdersCount(): Promise<number> {
    try {
      console.log('Getting orders count using direct SQL...');
      const query = "SELECT COUNT(*) as count FROM orders";
      return await new Promise((resolve, reject) => {
        db.get(query, [], (err: any, row: { count: number }) => {
          if (err) {
            console.error('Error in getOrdersCount() SQL query:', err);
            reject(err);
          } else {
            resolve(row.count);
          }
        });
      });
    } catch (error) {
      console.error('Error in getOrdersCount():', error);
      throw error;
    }
  }
}
