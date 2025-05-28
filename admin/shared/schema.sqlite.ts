import { sqliteTable, text, integer, primaryKey, numeric, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
export const materials = sqliteTable("materials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull().default('عمومی'),
  price: integer("price").notNull(),
  unit: text("unit").notNull().default('گرم'),
  stock: integer("stock").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materials.$inferSelect;

// Recipes table
export const recipes = sqliteTable("recipes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  priceCoefficient: numeric("price_coefficient").notNull().default("3.3"),
  costPrice: integer("cost_price").notNull().default(0),
  sellPrice: integer("sell_price").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  costPrice: true,
  sellPrice: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;

// Recipe Ingredients table
export const recipeIngredients = sqliteTable("recipe_ingredients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipeId: integer("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  materialId: integer("material_id")
    .notNull()
    .references(() => materials.id, { onDelete: "restrict" }),
  amount: integer("amount").notNull(),
}, (table) => ({
  recipeIngredientUnique: uniqueIndex("recipe_ingredient_unique").on(table.recipeId, table.materialId),
}));

export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({
  id: true,
});

export type InsertRecipeIngredient = z.infer<typeof insertRecipeIngredientSchema>;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;

// Menu Items table
export const menuItems = sqliteTable("menu_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  recipeId: integer("recipe_id").notNull(),
  price: integer("price").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

// Activities table
export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  entityName: text("entity_name"),
  description: text("description").notNull(),
  userId: integer("user_id").default(1),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// Order items table
export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  menuItemName: text("menu_item_name").notNull(),
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
  totalPrice: integer("total_price").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// Orders table
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name"),
  totalAmount: integer("total_amount").notNull(),
  isPaid: integer("is_paid", { mode: "boolean" }).notNull().default(false),
  paymentMethod: text("payment_method"),
  status: text("status").notNull().default('completed'), // 'pending', 'completed', 'cancelled'
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
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
export const salesSummary = sqliteTable("sales_summary", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(), // Jalali date in YYYY-MM-DD format
  totalSales: integer("total_sales").notNull().default(0),
  totalOrders: integer("total_orders").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertSalesSummarySchema = createInsertSchema(salesSummary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSalesSummary = z.infer<typeof insertSalesSummarySchema>;
export type SalesSummary = typeof salesSummary.$inferSelect;