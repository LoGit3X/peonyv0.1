import { pgTable, text, serial, integer, boolean, timestamp, json, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (keeping original)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Materials table
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materials.$inferSelect;

// Recipes table
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  priceCoefficient: numeric("price_coefficient").notNull().default("1.0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;

// Recipe Ingredients table (junction table)
export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull(),
  materialId: integer("material_id").notNull(),
  amount: integer("amount").notNull(),
});

export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({
  id: true,
});

export type InsertRecipeIngredient = z.infer<typeof insertRecipeIngredientSchema>;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;

// Menu Items table
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  recipeId: integer("recipe_id").notNull(),
  price: integer("price").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'add', 'edit', 'delete', 'calculate'
  entity: text("entity").notNull(), // 'material', 'recipe', 'menu', 'sale'
  entityId: integer("entity_id"),
  entityName: text("entity_name"),
  description: text("description").notNull(),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// Order items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  menuItemName: text("menu_item_name").notNull(),
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
  totalPrice: integer("total_price").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name"),
  totalAmount: integer("total_amount").notNull(),
  isPaid: boolean("is_paid").notNull().default(false),
  paymentMethod: text("payment_method"),
  status: text("status").notNull().default('completed'), // 'pending', 'completed', 'cancelled'
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  jalaliDate: text("jalali_date").notNull(),
  jalaliTime: text("jalali_time").notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Sales summary for reporting
export const salesSummary = pgTable("sales_summary", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // Jalali date in YYYY-MM-DD format
  totalSales: integer("total_sales").notNull().default(0),
  totalOrders: integer("total_orders").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSalesSummarySchema = createInsertSchema(salesSummary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSalesSummary = z.infer<typeof insertSalesSummarySchema>;
export type SalesSummary = typeof salesSummary.$inferSelect;
