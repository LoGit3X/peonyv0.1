import { Router } from 'express';
import axios from 'axios';
import { storage } from '../storage';

const router = Router();

// تنظیمات Google AI API
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const GOOGLE_AI_MODEL = 'gemini-pro';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_AI_MODEL}:generateContent?key=${GOOGLE_AI_API_KEY}`;

// Define interfaces for our data structures
interface Material {
  id: number;
  name: string;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

interface RecipeIngredient {
  material: {
    id: number;
    name: string;
    price: number;
    unit: string;
  };
  amount: number;
}

interface Recipe {
  id: number;
  name: string;
  category: string;
  priceCoefficient: number;
  ingredients: RecipeIngredient[];
  rawPrice: number;
  basePrice: number;
  finalPrice: number;
}

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
}

// Helper function to retrieve all data from database that AI might need
async function getDbDataForAI() {
  try {
    console.log('Starting to fetch data for AI...');
    
    // بازیابی مواد اولیه
    let materials = [];
    try {
      materials = await storage.getMaterials();
      console.log(`Retrieved ${materials.length} materials:`, 
        materials.map((m: Material) => m.name).join(', '));
    } catch (error) {
      console.error('Error fetching materials:', error);
      materials = [];
    }
    
    // بازیابی رسپی‌ها با جزئیات
    let recipes = [];
    try {
      recipes = await storage.getRecipes();
      console.log(`Retrieved ${recipes.length} recipes:`, 
        recipes.map((r: Recipe) => r.name).join(', '));
    } catch (error) {
      console.error('Error fetching recipes:', error);
      return {
        materials,
        recipes: [],
        menuItems: [],
        monthlySales: 0,
        error: 'خطا در بازیابی رسپی‌ها از پایگاه داده'
      };
    }
    
    if (!recipes || recipes.length === 0) {
      console.log('No recipes found in database');
      return {
        materials,
        recipes: [],
        menuItems: [],
        monthlySales: 0,
        error: 'در حال حاضر هیچ رسپی‌ای در سیستم ثبت نشده است. لطفاً ابتدا چند رسپی اضافه کنید.'
      };
    }
    
    // بازیابی مواد تشکیل دهنده هر رسپی
    const recipesWithIngredients = await Promise.all(recipes.map(async (recipe: Recipe) => {
      try {
        const ingredients = await storage.getRecipeIngredients(recipe.id);
        console.log(`Recipe ${recipe.name} (ID: ${recipe.id}) has ${ingredients.length} ingredients:`,
          ingredients.map((i: RecipeIngredient) => `${i.material.name} (${i.amount})`).join(', '));
        
        if (!ingredients || ingredients.length === 0) {
          console.log(`Warning: Recipe ${recipe.name} has no ingredients`);
          return {
            ...recipe,
            ingredients: [],
            rawPrice: 0,
            basePrice: 0,
            finalPrice: 0
          };
        }
        
        const rawPrice = ingredients.reduce((total: number, ing: RecipeIngredient) => {
          if (!ing.material || !ing.material.price || !ing.amount) {
            console.warn(`Warning: Invalid ingredient data for recipe ${recipe.name}:`, ing);
            return total;
          }
          return total + (ing.material.price * ing.amount);
        }, 0);
        
        const basePrice = rawPrice * (recipe.priceCoefficient || 3.3);
        
        // Update to use the 9% formula
        const finalPrice = basePrice * 1.09;
        
        return {
          ...recipe,
          ingredients,
          rawPrice: Math.round(rawPrice),
          basePrice: Math.round(basePrice),
          finalPrice: Math.round(finalPrice)
        };
      } catch (error) {
        console.error(`Error processing recipe ${recipe.name} (ID: ${recipe.id}):`, error);
        return {
          ...recipe,
          ingredients: [],
          rawPrice: 0,
          basePrice: 0,
          finalPrice: 0
        };
      }
    }));
    
    // بازیابی آیتم‌های منو
    let menuItems = [];
    try {
      menuItems = await storage.getMenuItems();
      console.log(`Retrieved ${menuItems.length} menu items:`,
        menuItems.map((m: MenuItem) => m.name).join(', '));
    } catch (error) {
      console.error('Error fetching menu items:', error);
      menuItems = [];
    }
    
    // بازیابی آمار فروش
    let monthlySales = 0;
    try {
      monthlySales = await storage.getMonthlySales();
      console.log(`Retrieved monthly sales: ${monthlySales}`);
    } catch (error) {
      console.error('Error fetching monthly sales:', error);
    }
    
    // اگر هیچ داده‌ای بازیابی نشد
    if (!materials.length && !recipes.length && !menuItems.length && !monthlySales) {
      return {
        materials: [],
        recipes: [],
        menuItems: [],
        monthlySales: 0,
        error: 'هیچ داده‌ای در پایگاه داده یافت نشد. لطفاً ابتدا داده‌های اولیه را وارد کنید.'
      };
    }
    
    return {
      materials,
      recipes: recipesWithIngredients,
      menuItems,
      monthlySales
    };
  } catch (error) {
    console.error('Error fetching data for AI:', error);
    throw error;
  }
}

// Helper function to find a material by name in query
function findMaterialByName(materials: Material[], query: string) {
  if (!query || !materials || materials.length === 0) return null;
  
  // Remove quotation marks and extra spaces from the query
  const cleanQuery = query.replace(/["']/g, '').trim();
  
  // Extract material name from query if it contains price or cost words
  let materialName = cleanQuery;
  if (cleanQuery.includes('قیمت')) {
    // Extract everything after "قیمت" and before any question mark or other punctuation
    const match = cleanQuery.match(/قیمت\s+([^؟\.,!]+)/i);
    if (match && match[1]) {
      materialName = match[1].trim();
    }
  }
  
  // First try exact match
  const exactMatch = materials.find((m: Material) => 
    m.name.trim() === materialName
  );
  
  if (exactMatch) return exactMatch;
  
  // Then try contains match (case-sensitive in Persian)
  const containsMatch = materials.find((m: Material) => 
    m.name.includes(materialName) || materialName.includes(m.name)
  );
  
  if (containsMatch) return containsMatch;
  
  // Finally try a more flexible approach - check if any word in the material name matches
  // Split the material name into words and check each word
  const words = materialName.split(/\s+/);
  for (const word of words) {
    if (word.length < 2) continue; // Skip very short words
    
    const wordMatch = materials.find((m: Material) => 
      m.name.includes(word)
    );
    
    if (wordMatch) return wordMatch;
  }
  
  return null;
}

// Helper function to get materials statistics
function getMaterialsStats(materials: Material[]) {
  if (!materials || materials.length === 0) {
    return {
      mostExpensive: null,
      leastExpensive: null,
      averagePrice: 0,
      totalMaterials: 0
    };
  }
  
  // Sort materials by price (ascending)
  const sortedMaterials = [...materials].sort((a, b) => a.price - b.price);
  
  // Get most and least expensive
  const leastExpensive = sortedMaterials[0];
  const mostExpensive = sortedMaterials[sortedMaterials.length - 1];
  
  // Calculate average price
  const totalPrice = materials.reduce((sum, m) => sum + m.price, 0);
  const averagePrice = Math.round(totalPrice / materials.length);
  
  return {
    mostExpensive,
    leastExpensive,
    averagePrice,
    totalMaterials: materials.length
  };
}

// Helper function to find a recipe by name in query
function findRecipeByName(recipes: any[], query: string) {
  if (!query || !recipes || recipes.length === 0) return null;
  
  const cleanQuery = query.replace(/["']/g, '').trim();
  
  // First try exact match
  const exactMatch = recipes.find(r => r.name.trim() === cleanQuery);
  if (exactMatch) return exactMatch;
  
  // Then try contains match
  const containsMatch = recipes.find(r => 
    r.name.includes(cleanQuery) || cleanQuery.includes(r.name)
  );
  if (containsMatch) return containsMatch;
  
  // Finally try word matching
  const words = cleanQuery.split(/\s+/);
  for (const word of words) {
    if (word.length < 2) continue;
    const wordMatch = recipes.find(r => r.name.includes(word));
    if (wordMatch) return wordMatch;
  }
  
  return null;
}

// Helper function to find a menu item by name in query
function findMenuItemByName(menuItems: any[], query: string) {
  if (!query || !menuItems || menuItems.length === 0) return null;
  
  const cleanQuery = query.replace(/["']/g, '').trim();
  
  // First try exact match
  const exactMatch = menuItems.find(m => m.name.trim() === cleanQuery);
  if (exactMatch) return exactMatch;
  
  // Then try contains match
  const containsMatch = menuItems.find(m => 
    m.name.includes(cleanQuery) || cleanQuery.includes(m.name)
  );
  if (containsMatch) return containsMatch;
  
  // Finally try word matching
  const words = cleanQuery.split(/\s+/);
  for (const word of words) {
    if (word.length < 2) continue;
    const wordMatch = menuItems.find(m => m.name.includes(word));
    if (wordMatch) return wordMatch;
  }
  
  return null;
}

// Helper function to get recipe statistics
function getRecipeStats(recipes: Recipe[]) {
  if (!recipes || recipes.length === 0) {
    return {
      mostExpensive: null,
      leastExpensive: null,
      averagePrice: 0,
      totalRecipes: 0,
      categories: {} as Record<string, number>
    };
  }
  
  // Sort recipes by final price
  const sortedRecipes = [...recipes].sort((a, b) => a.finalPrice - b.finalPrice);
  
  // Get most and least expensive
  const leastExpensive = sortedRecipes[0];
  const mostExpensive = sortedRecipes[sortedRecipes.length - 1];
  
  // Calculate average price
  const totalPrice = recipes.reduce((sum, r) => sum + r.finalPrice, 0);
  const averagePrice = Math.round(totalPrice / recipes.length);
  
  // Count recipes by category
  const categories = recipes.reduce((acc: Record<string, number>, recipe) => {
    acc[recipe.category] = (acc[recipe.category] || 0) + 1;
    return acc;
  }, {});
  
  return {
    mostExpensive,
    leastExpensive,
    averagePrice,
    totalRecipes: recipes.length,
    categories
  };
}

// Extended menu stats interface
interface MenuStats {
  totalItems: number;
  categories: Record<string, number>;
  averagePrice: number;
  mostExpensive?: MenuItem;
  leastExpensive?: MenuItem;
}

// Helper function to get menu stats with extended return type
function getMenuStats(menuItems: MenuItem[]): MenuStats {
  if (!menuItems || menuItems.length === 0) {
    return {
      totalItems: 0,
      categories: {},
      averagePrice: 0
    };
  }

  const categories: Record<string, number> = {};
  let totalPrice = 0;

  menuItems.forEach(item => {
    categories[item.category] = (categories[item.category] || 0) + 1;
    totalPrice += item.price;
  });

  const sortedByPrice = [...menuItems].sort((a, b) => a.price - b.price);

  return {
    totalItems: menuItems.length,
    categories,
    averagePrice: Math.round(totalPrice / menuItems.length),
    mostExpensive: sortedByPrice[sortedByPrice.length - 1],
    leastExpensive: sortedByPrice[0]
  };
}

// Helper function to get detailed recipe information
async function getDetailedRecipeInfo(recipe: Recipe, materials: Material[]) {
  const ingredients = recipe.ingredients.map(ing => ({
    name: ing.material.name,
    amount: ing.amount,
    unit: ing.material.unit,
    price: ing.material.price * ing.amount
  }));

  const totalCost = ingredients.reduce((sum, ing) => sum + ing.price, 0);
  const profit = recipe.finalPrice - totalCost;
  const profitMargin = ((profit / recipe.finalPrice) * 100).toFixed(1);

  return {
    ...recipe,
    ingredients,
    totalCost,
    profit,
    profitMargin
  };
}

// Helper function to analyze recipe costs
function analyzeRecipeCosts(recipes: Recipe[]) {
  const analysis = recipes.map(recipe => ({
    name: recipe.name,
    category: recipe.category,
    costPrice: recipe.rawPrice,
    sellPrice: recipe.finalPrice,
    profit: recipe.finalPrice - recipe.rawPrice,
    profitMargin: ((recipe.finalPrice - recipe.rawPrice) / recipe.finalPrice * 100).toFixed(1)
  }));

  return {
    recipes: analysis,
    averageProfit: analysis.reduce((sum: number, r: typeof analysis[0]) => sum + (r.sellPrice - r.costPrice), 0) / analysis.length,
    averageMargin: analysis.reduce((sum: number, r: typeof analysis[0]) => sum + parseFloat(r.profitMargin), 0) / analysis.length
  };
}

// Helper function to get ingredient usage across recipes
function analyzeIngredientUsage(recipes: Recipe[]) {
  const usage: Record<string, { count: number; recipes: string[] }> = {};
  
  recipes.forEach(recipe => {
    recipe.ingredients.forEach(ing => {
      if (!usage[ing.material.name]) {
        usage[ing.material.name] = { count: 0, recipes: [] };
      }
      usage[ing.material.name].count++;
      usage[ing.material.name].recipes.push(recipe.name);
    });
  });

  return usage;
}

// Main route handler
router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    // Get all necessary data
    let systemData;
    try {
      systemData = await getDbDataForAI();
    } catch (error) {
      console.error('Failed to get data for AI:', error);
      return res.status(500).json({ 
        error: 'خطا در دریافت اطلاعات از پایگاه داده. لطفاً دوباره تلاش کنید.'
      });
    }

    // If there's an error message from data fetching, return it
    if (systemData.error) {
      return res.json({ response: systemData.error });
    }

    const userMessage = messages[messages.length - 1].content.toLowerCase();
    
    // Complex query handling
    let aiResponse = '';
    
    // Recipe specific queries
    if (userMessage.includes('رسپی') || userMessage.includes('دستور')) {
      const recipeName = findRecipeByName(systemData.recipes, userMessage);
      
      if (recipeName) {
        const recipeDetails = await getDetailedRecipeInfo(recipeName, systemData.materials);
        
        if (userMessage.includes('مواد') || userMessage.includes('محتویات')) {
          const ingredientsList = recipeDetails.ingredients
            .map(ing => `${ing.name} (${ing.amount}${ing.unit} - ${ing.price} تومان)`)
            .join('، ');
          
          aiResponse = `مواد تشکیل دهنده ${recipeName.name}:\n${ingredientsList}\n` +
                      `قیمت تمام شده: ${recipeDetails.totalCost} تومان\n` +
                      `قیمت فروش: ${recipeDetails.finalPrice} تومان\n` +
                      `سود: ${recipeDetails.profit} تومان (${recipeDetails.profitMargin}٪)`;
        }
        else if (userMessage.includes('قیمت') || userMessage.includes('هزینه')) {
          aiResponse = `اطلاعات قیمت ${recipeName.name}:\n` +
                      `قیمت تمام شده: ${recipeDetails.totalCost} تومان\n` +
                      `قیمت فروش: ${recipeDetails.finalPrice} تومان\n` +
                      `سود: ${recipeDetails.profit} تومان (${recipeDetails.profitMargin}٪)`;
        }
        else {
          const ingredientsList = recipeDetails.ingredients
            .map(ing => `${ing.name} (${ing.amount}${ing.unit})`)
            .join('، ');
          
          aiResponse = `اطلاعات کامل ${recipeName.name}:\n` +
                      `دسته: ${recipeName.category}\n` +
                      `مواد تشکیل دهنده: ${ingredientsList}\n` +
                      `قیمت تمام شده: ${recipeDetails.totalCost} تومان\n` +
                      `قیمت فروش: ${recipeDetails.finalPrice} تومان\n` +
                      `سود: ${recipeDetails.profit} تومان (${recipeDetails.profitMargin}٪)`;
        }
      }
      else if (userMessage.includes('سودآور') || userMessage.includes('پرسود')) {
        const analysis = analyzeRecipeCosts(systemData.recipes);
        const sortedByProfit = [...analysis.recipes].sort((a, b) => 
          parseFloat(b.profitMargin) - parseFloat(a.profitMargin)
        );
        
        const top5 = sortedByProfit.slice(0, 5);
        aiResponse = `پرسودترین رسپی‌ها:\n` +
                    top5.map(r => `${r.name}: سود ${r.profitMargin}٪ (${r.profit} تومان)`)
                      .join('\n') +
                    `\n\nمیانگین حاشیه سود: ${analysis.averageMargin.toFixed(1)}٪`;
      }
      else if (userMessage.includes('مقایسه') || userMessage.includes('مقایسه کن')) {
        const recipes = systemData.recipes;
        const analysis = analyzeRecipeCosts(recipes);
        
        aiResponse = `مقایسه رسپی‌ها:\n` +
                    recipes.map((r: Recipe) => 
                      `${r.name}:\n` +
                      `- قیمت تمام شده: ${r.rawPrice} تومان\n` +
                      `- قیمت فروش: ${r.finalPrice} تومان\n` +
                      `- سود: ${r.finalPrice - r.rawPrice} تومان\n`
                    ).join('\n');
      }
      else {
        const stats = getRecipeStats(systemData.recipes);
        aiResponse = `اطلاعات کلی رسپی‌ها:\n` +
                    `تعداد کل: ${stats.totalRecipes} رسپی\n` +
                    `میانگین قیمت: ${stats.averagePrice} تومان\n` +
                    `گران‌ترین: ${stats.mostExpensive?.name} (${stats.mostExpensive?.finalPrice} تومان)\n` +
                    `ارزان‌ترین: ${stats.leastExpensive?.name} (${stats.leastExpensive?.finalPrice} تومان)`;
      }
    }
    // Ingredient specific queries
    else if (userMessage.includes('ماده') || userMessage.includes('مواد اولیه')) {
      const materialName = findMaterialByName(systemData.materials, userMessage);
      
      if (materialName) {
        const usage = analyzeIngredientUsage(systemData.recipes);
        const materialUsage = usage[materialName.name];
        
        if (userMessage.includes('استفاده') || userMessage.includes('کاربرد')) {
          aiResponse = `ماده اولیه "${materialName.name}" در ${materialUsage?.count || 0} رسپی استفاده شده:\n` +
                      (materialUsage?.recipes.join('، ') || 'هیچ رسپی‌ای');
        }
        else if (userMessage.includes('قیمت') || userMessage.includes('هزینه')) {
          aiResponse = `اطلاعات قیمت ${materialName.name}:\n` +
                      `قیمت: ${materialName.price} تومان\n` +
                      `استفاده در ${materialUsage?.count || 0} رسپی`;
        }
        else {
          aiResponse = `اطلاعات کامل ${materialName.name}:\n` +
                      `قیمت: ${materialName.price} تومان\n` +
                      `استفاده در رسپی‌ها: ${materialUsage?.recipes.join('، ') || 'هیچ رسپی‌ای'}`;
        }
      }
      else {
        const stats = getMaterialsStats(systemData.materials);
        aiResponse = `اطلاعات کلی مواد اولیه:\n` +
                    `تعداد کل: ${stats.totalMaterials} ماده\n` +
                    `میانگین قیمت: ${stats.averagePrice} تومان\n` +
                    `گران‌ترین: ${stats.mostExpensive?.name} (${stats.mostExpensive?.price} تومان)\n` +
                    `ارزان‌ترین: ${stats.leastExpensive?.name} (${stats.leastExpensive?.price} تومان)`;
      }
    }
    // Menu specific queries
    else if (userMessage.includes('منو') || userMessage.includes('آیتم')) {
      const stats = getMenuStats(systemData.menuItems);
      
      if (userMessage.includes('دسته') || userMessage.includes('کتگوری')) {
        const categoriesList = Object.entries(stats.categories)
          .map(([category, count]) => `${category}: ${count} مورد`)
          .join('\n');
        aiResponse = `دسته‌بندی منو:\n${categoriesList}`;
      }
      else if (userMessage.includes('قیمت') || userMessage.includes('گران')) {
        aiResponse = `اطلاعات قیمت منو:\n` +
                    `میانگین قیمت: ${stats.averagePrice} تومان\n` +
                    `گران‌ترین: ${stats.mostExpensive?.name} (${stats.mostExpensive?.price} تومان)\n` +
                    `ارزان‌ترین: ${stats.leastExpensive?.name} (${stats.leastExpensive?.price} تومان)`;
      }
      else {
        const menuByCategory = systemData.menuItems.reduce((acc: Record<string, MenuItem[]>, item: MenuItem) => {
          if (!acc[item.category]) acc[item.category] = [];
          acc[item.category].push(item);
          return acc;
        }, {});
        
        aiResponse = `منوی کامل (${stats.totalItems} آیتم):\n` +
                    (Object.entries(menuByCategory) as [string, MenuItem[]][])
                      .map(([category, items]) => 
                        `${category}:\n` +
                        items.map((i: MenuItem) => `- ${i.name}: ${i.price} تومان`).join('\n')
                      )
                      .join('\n\n');
      }
    }
    // Sales and statistics queries
    else if (userMessage.includes('فروش') || userMessage.includes('آمار')) {
      aiResponse = `آمار فروش:\n` +
                  `فروش ماه جاری: ${systemData.monthlySales} میلیون تومان\n`;
    }
    // Default response
    else {
      aiResponse = `من دستیار هوشمند کافه پیونی هستم و می‌توانم به سؤالات پیچیده شما در این موارد پاسخ دهم:

1. رسپی‌ها:
   - جزئیات کامل هر رسپی
   - مواد تشکیل دهنده و مقادیر
   - قیمت تمام شده و فروش
   - مقایسه رسپی‌ها
   - تحلیل سودآوری

2. مواد اولیه:
   - اطلاعات هر ماده اولیه
   - قیمت و موجودی
   - کاربرد در رسپی‌ها
   - آمار و مقایسه‌ها

3. منو:
   - آیتم‌های هر دسته
   - قیمت‌ها و مقایسه
   - دسته‌بندی‌ها

4. آمار فروش و گزارش‌ها

لطفاً سؤال خود را بپرسید.`;
    }
    
    return res.json({ response: aiResponse });
    
  } catch (error) {
    console.error('Error in AI chat endpoint:', error);
    return res.status(500).json({ error: 'خطا در پردازش درخواست' });
  }
});

export default router; 