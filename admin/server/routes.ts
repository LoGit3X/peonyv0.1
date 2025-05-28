console.log("--- ADMIN SERVER ROUTES.TS LOADING - VERSION: ", new Date().toISOString(), "---"); // New log
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertMaterialSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertSalesSummarySchema,
  type Recipe, // Added import
  type RecipeIngredient, // Added import
  type OrderItem // Added import
} from "@shared/schema.sqlite";
import aiRouter from './api/ai';
import jalaali from 'jalaali-js';
import * as fs from 'fs';
import * as path from 'path';
import multer from 'multer';

// Debug logs to check imported storage
console.log("ROUTES: Imported storage type:", typeof storage);
console.log("ROUTES: Imported storage keys:", Object.keys(storage));
console.log("ROUTES: getMaterialsCount exists on import:", typeof storage.getMaterialsCount === 'function');

// Helper function for formatting price (assuming it's not imported from elsewhere)
function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price);
}

// Interface for processed recipe
interface ProcessedRecipe extends Recipe {
  rawPrice: number;
  basePrice: number;
  finalPrice: number;
  ingredients?: RecipeIngredient[];
}

// Set up multer storage for image uploads
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'attached_assets', 'recipe_images');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate filename using recipe ID
    const recipeId = req.params.id; // Get recipe ID from request parameters
    const ext = path.extname(file.originalname);
    // Sanitize recipeId just in case, though it should be numeric
    const safeRecipeId = String(recipeId).replace(/[^a-zA-Z0-9-_]/g, '');
    cb(null, `recipe-${safeRecipeId}${ext}`);
  }
});

const upload = multer({ 
  storage: storage_config,
  // limits: {
  //   fileSize: 12 * 1024 * 1024, // 12MB max file size (Limit removed)
  // },
  fileFilter: function (req, file, cb) {
    // Accept only images
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return cb(new Error('Only image files are allowed!')); // Corrected callback
    }
    cb(null, true);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Register AI routes
  app.use('/api/ai', aiRouter);

  // Materials routes
  app.get("/api/materials", async (req, res) => {
    try {
      console.log('API endpoint /api/materials called');
      const materials = await storage.getMaterials();
      console.log(`Successfully fetched ${materials.length} materials`);

      if (!Array.isArray(materials)) {
        console.error('Non-array materials data:', materials);
        throw new Error('Invalid materials data format');
      }

      // Convert SQLite response to expected Material format
      // This ensures all fields are properly formatted regardless of the source database
      const formattedMaterials = materials.map(material => {
        // Make sure price is a number and never negative or NaN
        let price = Number(material.price || 0);
        if (isNaN(price) || price < 0) price = 0;
        
        // Make sure stock is a number and never negative or NaN
        let stock = Number(material.stock || 0);
        if (isNaN(stock) || stock < 0) stock = 0;
        
        return {
          id: Number(material.id),
          name: String(material.name || ''),
          price: price,
          stock: stock,
          createdAt: material.created_at || new Date().toISOString(),
          updatedAt: material.updated_at || new Date().toISOString(),
        };
      });

      console.log('Returning materials array with length:', formattedMaterials.length);
      if (formattedMaterials.length > 0) {
        console.log('First material example:', JSON.stringify(formattedMaterials[0], null, 2));
      }

      // Set proper headers to prevent caching issues
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Content-Type', 'application/json');

      res.json(formattedMaterials);
    } catch (error) {
      console.error('Detailed error in GET /api/materials:', error);
      res.status(500).json({
        message: "Error fetching materials",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const material = await storage.getMaterial(id);

      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      res.json(material);
    } catch (error) {
      res.status(500).json({ message: "Error fetching material" });
    }
  });

  app.post("/api/materials", async (req, res) => {
    try {
      console.log('API endpoint POST /api/materials called with body:', JSON.stringify(req.body));
      const validation = insertMaterialSchema.safeParse(req.body);

      if (!validation.success) {
        console.error('Validation error in POST /api/materials:', validation.error.errors);
        return res.status(400).json({
          message: "Invalid input data",
          errors: validation.error.errors
        });
      }

      const material = await storage.createMaterial(validation.data);
      res.status(201).json(material);
    } catch (error) {
      console.error('Detailed error in POST /api/materials:', error);
      res.status(500).json({
        message: "Error creating material",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put("/api/materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('PUT /api/materials/:id - Request body:', req.body);

      // Validate partial schema
      const validationSchema = insertMaterialSchema.partial();
      const validation = validationSchema.safeParse(req.body);

      if (!validation.success) {
        console.error('Validation error:', validation.error.errors);
        return res.status(400).json({
          message: "Invalid input data",
          errors: validation.error.errors
        });
      }

      console.log('Validated data:', validation.data);
      const updatedMaterial = await storage.updateMaterial(id, validation.data);
      console.log('Updated material:', updatedMaterial);

      if (!updatedMaterial) {
        return res.status(404).json({ message: "Material not found" });
      }

      res.json(updatedMaterial);
    } catch (error) {
      console.error('Error updating material:', error);
      res.status(500).json({ message: "Error updating material" });
    }
  });

  app.delete("/api/materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMaterial(id);

      if (!deleted) {
        return res.status(404).json({ message: "Material not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting material" });
    }
  });

  // Material stock routes
  app.get("/api/materials/:id/stock", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const stock = await storage.getMaterialStock(id);

      if (stock === undefined) {
        return res.status(404).json({ message: "Material not found" });
      }

      res.json({ stock });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching material stock",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put("/api/materials/:id/stock", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { amount } = req.body;

      if (typeof amount !== 'number') {
        return res.status(400).json({ message: "Amount must be a number" });
      }

      const newStock = await storage.updateMaterialStock(id, amount);
      res.json({ stock: newStock });
    } catch (error) {
      res.status(500).json({
        message: "Error updating material stock",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Activities routes
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Error fetching activities" });
    }
  });

  // Recipe routes
  app.get("/api/recipes", async (req, res) => {
    try {
      console.log('API endpoint /api/recipes called');
      const recipes = await storage.getRecipes();
      
      if (!Array.isArray(recipes)) {
        console.error('API endpoint /api/recipes - ERROR: Recipes data is not an array');
        throw new Error('Invalid recipes data format from storage.getRecipes()');
      }

      console.log(`Successfully fetched ${recipes.length} recipes`);
      
      // Process recipes to include ingredients if requested
      const includeIngredients = req.query.include === 'ingredients';
      
      const processedRecipes: ProcessedRecipe[] = await Promise.all(recipes.map(async (recipe: Recipe): Promise<ProcessedRecipe> => {
        try {
          // Normalize recipe data
          const recipePriceCoefficientString = recipe.priceCoefficient || "3.3"; // Ensure it's a string
          const normalizedRecipe: Partial<ProcessedRecipe> = { // Use Partial here as ingredients are added later
            id: recipe.id,
            name: recipe.name,
            category: recipe.category,
            description: recipe.description || '',
            priceCoefficient: recipePriceCoefficientString, // Store as string
            imageUrl: recipe.imageUrl, // Add imageUrl here
            costPrice: 0,
            sellPrice: 0,
            createdAt: recipe.createdAt,
            updatedAt: recipe.updatedAt
          };
          
          // Get recipe ingredients
          const ingredients = await storage.getRecipeIngredients(recipe.id);
          
          // Calculate raw price (cost of all ingredients)
          let rawPrice = 0;
          
          if (ingredients && ingredients.length > 0) {
            for (const ingredient of ingredients) {
              try {
                const materialId = ingredient.materialId;
                const material = await storage.getMaterial(materialId);
                
                if (material && material.price) {
                  // قیمت ماده اولیه قبلاً بر اساس گرم است، نیازی به تبدیل از کیلوگرم نیست
                  const pricePerGram = material.price;
                  // هزینه این ماده اولیه در رسپی = قیمت هر گرم * مقدار مصرف شده
                  const ingredientCost = pricePerGram * ingredient.amount;
                  rawPrice += ingredientCost;
                  
                  console.log(`Ingredient ${materialId} (${material.name}): ${ingredient.amount}g at ${material.price} per gram = ${ingredientCost} toman`);
                } else {
                  console.log(`Material not found or has no price: ID ${materialId}`);
                }
              } catch (err) {
                console.error(`Error calculating price for ingredient ${ingredient.materialId}:`, err);
              }
            }
          }
          
          // Round to the nearest integer
          rawPrice = Math.round(rawPrice);
          
          // Calculate basePrice (raw price × priceCoefficient)
          // Use parseFloat for calculation, normalizedRecipe.priceCoefficient is string
          const pcValue = parseFloat(normalizedRecipe.priceCoefficient || "3.3") || 3.3;
          const basePrice = Math.round(rawPrice * pcValue);
          
          // Calculate finalPrice as basePrice + 9%
          const finalPrice = Math.round(basePrice * 1.09);
          
          console.log(`Recipe ${recipe.id} (${recipe.name}): rawPrice=${rawPrice}, coefficient=${pcValue}, basePrice=${basePrice}, finalPrice=${finalPrice}`);
          
          // Add calculated prices to recipe
          normalizedRecipe.costPrice = rawPrice;
          normalizedRecipe.sellPrice = finalPrice;
          
          // Add calculated price fields
          const result: ProcessedRecipe = {
            ...(normalizedRecipe as Recipe), // Cast to Recipe, then spread
            rawPrice,
            basePrice,
            finalPrice
          };
          
          // Add ingredients if requested
          if (includeIngredients) {
            result.ingredients = ingredients;
          }
          
          return result;
        } catch (error) {
          console.error(`Error processing recipe ${recipe.id} (${recipe.name}):`, error);
          // Return a minimal recipe object with error info to prevent the entire request from failing
          // Return a minimal recipe object conforming to ProcessedRecipe
          return {
            id: recipe.id,
            name: recipe.name,
            category: recipe.category || 'Unknown',
            description: `Error processing this recipe: ${error instanceof Error ? error.message : 'Unknown error'}`,
            priceCoefficient: '0', // Default string value
            imageUrl: null,
            costPrice: 0,
            sellPrice: 0,
            rawPrice: 0,
            basePrice: 0,
            finalPrice: 0,
            createdAt: recipe.createdAt || new Date().toISOString(), // Ensure all Recipe fields are present
            updatedAt: recipe.updatedAt || new Date().toISOString()  // Ensure all Recipe fields are present
          };
        }
      }));
      
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Content-Type', 'application/json');
      res.json(processedRecipes);
    } catch (error) {
      console.error('Detailed error in GET /api/recipes:', error);
      res.status(500).json({
        message: "Error fetching recipes",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recipe = await storage.getRecipe(id);

      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      res.json(recipe);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recipe" });
    }
  });

  app.post("/api/recipes", async (req, res) => {
    try {
      console.log('API endpoint POST /api/recipes called with body:', JSON.stringify(req.body));

      // Validate recipe data
      const recipeSchema = z.object({
        name: z.string().min(1, "نام رسپی الزامی است"),
        category: z.string().min(1, "دسته‌بندی الزامی است"),
        description: z.string().optional(),
        priceCoefficient: z.number().min(0.1, "ضریب قیمت باید حداقل 0.1 باشد")
      });

      const validation = recipeSchema.safeParse(req.body);

      if (!validation.success) {
        console.error('Validation error in POST /api/recipes:', validation.error.errors);
        return res.status(400).json({
          message: "Invalid input data",
          errors: validation.error.errors
        });
      }

      const recipe = await storage.createRecipe(validation.data);
      res.status(201).json(recipe);
    } catch (error) {
      console.error('Detailed error in POST /api/recipes:', error);
      res.status(500).json({
        message: "Error creating recipe",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Validate recipe data
      const recipeSchema = z.object({
        name: z.string().min(1, "نام رسپی الزامی است").optional(),
        category: z.string().min(1, "دسته‌بندی الزامی است").optional(),
        description: z.string().optional(),
        priceCoefficient: z.number().min(0.1, "ضریب قیمت باید حداقل 0.1 باشد").optional()
      });

      const validation = recipeSchema.safeParse(req.body);

      if (!validation.success) {
        console.error('Validation error in PUT /api/recipes:', validation.error.errors);
        return res.status(400).json({
          message: "Invalid input data",
          errors: validation.error.errors
        });
      }

      const updatedRecipe = await storage.updateRecipe(id, validation.data);

      if (!updatedRecipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      res.json(updatedRecipe);
    } catch (error) {
      console.error('Detailed error in PUT /api/recipes:', error);
      res.status(500).json({
        message: "Error updating recipe",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.delete("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the recipe to check if it has an image
      const recipe = await storage.getRecipe(id);
      
      if (recipe && recipe.imageUrl) {
        // Delete the image file if it exists
        const imagePath = path.join(process.cwd(), recipe.imageUrl);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`Deleted recipe image: ${imagePath}`);
        }
      }
      
      const deleted = await storage.deleteRecipe(id);

      if (!deleted) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      res.status(500).json({ 
        message: "Error deleting recipe",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Recipe image upload endpoint
  app.post("/api/recipes/:id/image", upload.single('image'), async (req, res) => {
    try {
      const recipeId = parseInt(req.params.id);
      const file = req.file;
      
      console.log('Recipe image upload request received for recipe ID:', recipeId);
      console.log('Uploaded file details:', file);
      
      if (!file) {
        console.error('No file was uploaded');
        return res.status(400).json({ message: "No image file provided" });
      }
      
      // Get existing recipe
      const recipe = await storage.getRecipe(recipeId);
      if (!recipe) {
        console.error(`Recipe with ID ${recipeId} not found`);
        // Delete the uploaded file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          console.log(`Deleted uploaded file as recipe not found: ${file.path}`);
        }
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      console.log('Found recipe:', recipe);
      
      // If recipe already has an image, delete the old one
      if (recipe.imageUrl) {
        const oldImagePath = path.join(process.cwd(), recipe.imageUrl);
        console.log(`Checking for existing image at: ${oldImagePath}`);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log(`Deleted old recipe image: ${oldImagePath}`);
        } else {
          console.log(`Old image path does not exist: ${oldImagePath}`);
        }
      }
      
      // Get the relative path to store in database
      const relativePath = path.relative(process.cwd(), file.path).replace(/\\/g, '/');
      console.log(`Relative path for storage: ${relativePath}`);
      console.log(`Full file path: ${file.path}`);
      
      // Ensure the file exists
      if (!fs.existsSync(file.path)) {
        console.error(`Upload failed: File not found at ${file.path}`);
        return res.status(500).json({ message: "File upload failed - file not found" });
      }
      
      // Double check directory exists
      const uploadDir = path.join(process.cwd(), 'attached_assets', 'recipe_images');
      if (!fs.existsSync(uploadDir)) {
        console.log(`Creating upload directory: ${uploadDir}`);
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Update recipe with new image URL
      const updatedRecipe = await storage.updateRecipe(recipeId, {
        imageUrl: relativePath
      });
      
      if (!updatedRecipe || !updatedRecipe.imageUrl) {
        console.error(`Failed to update recipe ${recipeId} with imageUrl ${relativePath}`);
        
        // Try one more time with direct database update
        console.log("Attempting direct database update as fallback");
        
        try {
          // Direct database update as fallback
          const retryUpdate = await storage.updateRecipe(recipeId, {
            imageUrl: relativePath
          });
          
          console.log("Retry update result:", retryUpdate);
          
          if (!retryUpdate || !retryUpdate.imageUrl) {
            console.error("Fallback update also failed");
            throw new Error("Failed to update recipe with image URL after multiple attempts");
          }
        } catch (retryError) {
          console.error("Error in fallback update:", retryError);
          throw new Error("Failed to update recipe with image URL");
        }
      }
      
      console.log(`Recipe ${recipeId} updated with imageUrl: ${relativePath}`);
      console.log('Updated recipe:', updatedRecipe);
      
      // Verify the image URL was actually saved correctly
      const verifyRecipe = await storage.getRecipe(recipeId);
      if (!verifyRecipe || verifyRecipe.imageUrl !== relativePath) {
        console.warn(`Image URL verification failed: ${verifyRecipe?.imageUrl} vs expected ${relativePath}`);
      } else {
        console.log(`Image URL verification successful: ${verifyRecipe.imageUrl}`);
      }
      
      res.status(200).json({
        message: "Image uploaded successfully",
        imageUrl: relativePath,
        recipe: updatedRecipe || verifyRecipe
      });
    } catch (error) {
      console.error('Error uploading recipe image:', error);
      res.status(500).json({ 
        message: "Error uploading image",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Delete recipe image
  app.delete("/api/recipes/:id/image", async (req, res) => {
    try {
      const recipeId = parseInt(req.params.id);
      console.log(`Attempt to delete image for recipe ID: ${recipeId}`);
      
      // Get existing recipe
      const recipe = await storage.getRecipe(recipeId);
      if (!recipe) {
        console.error(`Recipe with ID ${recipeId} not found`);
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      console.log(`Found recipe:`, recipe);
      
      // If recipe has an image, delete it
      if (recipe.imageUrl) {
        const imagePath = path.join(process.cwd(), recipe.imageUrl);
        console.log(`Checking for image at: ${imagePath}`);
        
        let fileDeleted = false;
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
            fileDeleted = true;
            console.log(`Deleted recipe image file: ${imagePath}`);
          } catch (unlinkError) {
            console.error(`Error deleting image file: ${imagePath}`, unlinkError);
            // Continue even if file deletion fails, we still want to update the database
          }
        } else {
          console.log(`Image file not found at: ${imagePath}`);
        }
        
        // Update recipe to remove image URL
        console.log(`Updating recipe ${recipeId} to remove imageUrl`);
        let updateSuccess = false;
        let updatedRecipe;
        
        try {
          updatedRecipe = await storage.updateRecipe(recipeId, {
            imageUrl: null
          });
          updateSuccess = true;
          console.log(`Recipe updated successfully:`, updatedRecipe);
        } catch (updateError) {
          console.error(`Error updating recipe ${recipeId} to remove imageUrl:`, updateError);
          
          // Try one more time
          try {
            console.log("Attempting second update to remove imageUrl");
            updatedRecipe = await storage.updateRecipe(recipeId, {
              imageUrl: null
            });
            updateSuccess = true;
            console.log(`Second update attempt successful:`, updatedRecipe);
          } catch (retryError) {
            console.error(`Error in second update attempt:`, retryError);
          }
        }
        
        // Verify the image URL was actually removed
        const verifyRecipe = await storage.getRecipe(recipeId);
        if (verifyRecipe && verifyRecipe.imageUrl === null) {
          console.log(`Verified imageUrl was removed from recipe ${recipeId}`);
        } else if (verifyRecipe) {
          console.warn(`Image URL still exists in recipe after removal attempt: ${verifyRecipe.imageUrl}`);
          
          // One final direct attempt
          try {
            console.log("Making final direct attempt to remove imageUrl");
            await storage.updateRecipe(recipeId, {
              imageUrl: null
            });
          } catch (finalError) {
            console.error("Error in final attempt to remove imageUrl:", finalError);
          }
        }
        
        return res.status(200).json({
          message: "Image deleted successfully",
          fileDeleted,
          databaseUpdated: updateSuccess
        });
      } else {
        console.log(`Recipe ${recipeId} has no image URL to delete`);
        return res.status(200).json({
          message: "No image to delete"
        });
      }
    } catch (error) {
      console.error('Error deleting recipe image:', error);
      res.status(500).json({ 
        message: "Error deleting image",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Recipe Ingredients routes
  app.get("/api/recipes/:id/ingredients", async (req, res) => {
    try {
      const recipeId = parseInt(req.params.id);
      console.log(`API: Getting ingredients for recipe ID ${recipeId}`);

      const ingredients = await storage.getRecipeIngredients(recipeId);
      console.log(`API: Found ${ingredients.length} ingredients:`, JSON.stringify(ingredients));

      res.json(ingredients);
    } catch (error) {
      console.error('API Error in GET /api/recipes/:id/ingredients:', error);
      res.status(500).json({ message: "Error fetching recipe ingredients" });
    }
  });

  app.put("/api/recipes/:id/ingredients", async (req, res) => {
    try {
      // Validate and parse recipe ID
      let recipeId;
      try {
        recipeId = parseInt(req.params.id, 10);

        if (isNaN(recipeId) || recipeId <= 0) {
          console.error(`API: Invalid recipe ID: ${req.params.id}`);
          return res.status(400).json({ message: `Invalid recipe ID: ${req.params.id}` });
        }
      } catch (idError) {
        console.error(`API: Error parsing recipe ID: ${req.params.id}`, idError);
        return res.status(400).json({ message: `Invalid recipe ID format: ${req.params.id}` });
      }

      // Verify the recipe exists before proceeding
      try {
        const recipeExists = await storage.getRecipe(recipeId);
        if (!recipeExists) {
          console.error(`API: Recipe with ID ${recipeId} not found`);
          return res.status(404).json({ message: `Recipe with ID ${recipeId} not found` });
        }
      } catch (recipeCheckError) {
        console.error(`API: Error checking if recipe exists: ${recipeId}`, recipeCheckError);
        return res.status(500).json({ message: "Error verifying recipe existence" });
      }

      const ingredients = req.body;

      console.log(`API: Updating ingredients for recipe ID ${recipeId}`);
      console.log('API: Ingredients received (raw):', JSON.stringify(req.body));

      // Validate ingredients data
      if (!Array.isArray(ingredients)) {
        console.error('API: Invalid ingredients data - not an array');
        return res.status(400).json({ message: "Invalid ingredients data: not an array" });
      }

      if (ingredients.length === 0) {
        console.warn('API: Empty ingredients array received');
      }

      // Process and validate each ingredient - ensure values are integers
      const processedIngredients = [];

      for (let i = 0; i < ingredients.length; i++) {
        const ing = ingredients[i];
        console.log(`API: Processing ingredient ${i}:`, ing);

        // Check if the required fields exist
        if (ing.materialId === undefined || ing.amount === undefined) {
          console.error(`API: Missing required fields in ingredient ${i}:`, ing);
          return res.status(400).json({
            message: "Invalid ingredient data: missing required fields",
            index: i,
            ingredient: ing
          });
        }

        // Convert and validate materialId - ensure it's an integer
        let materialId;
        try {
          if (typeof ing.materialId === 'string') {
            materialId = parseInt(ing.materialId, 10);
          } else if (typeof ing.materialId === 'number') {
            materialId = Math.floor(ing.materialId); // Use floor instead of round for consistency
          } else {
            throw new Error(`Invalid materialId type: ${typeof ing.materialId}`);
          }

          if (isNaN(materialId) || materialId <= 0) {
            throw new Error(`Invalid materialId value: ${materialId}`);
          }
        } catch (error) {
          console.error(`API: Invalid materialId in ingredient ${i}:`, error.message);
          return res.status(400).json({
            message: `Invalid materialId: ${error.message}`,
            index: i,
            ingredient: ing
          });
        }

        // Convert and validate amount - ensure it's an integer
        let amount;
        try {
          if (typeof ing.amount === 'string') {
            amount = Math.floor(parseFloat(ing.amount)); // Use floor instead of round
          } else if (typeof ing.amount === 'number') {
            amount = Math.floor(ing.amount); // Use floor instead of round
          } else {
            throw new Error(`Invalid amount type: ${typeof ing.amount}`);
          }

          if (isNaN(amount) || amount <= 0) {
            throw new Error(`Invalid amount value: ${amount}`);
          }
        } catch (error) {
          console.error(`API: Invalid amount in ingredient ${i}:`, error.message);
          return res.status(400).json({
            message: `Invalid amount: ${error.message}`,
            index: i,
            ingredient: ing
          });
        }

        // Triple check that the values are integers - use Math.floor for extra safety
        materialId = Math.floor(Number(materialId));
        amount = Math.floor(Number(amount));

        // Final validation check
        if (isNaN(materialId) || materialId <= 0) {
          return res.status(400).json({
            message: `Invalid materialId after final validation: ${materialId}`,
            index: i,
            ingredient: ing
          });
        }

        if (isNaN(amount) || amount <= 0) {
          return res.status(400).json({
            message: `Invalid amount after final validation: ${amount}`,
            index: i,
            ingredient: ing
          });
        }

        console.log(`API: Processed ingredient ${i} - materialId: ${materialId} (${typeof materialId}), amount: ${amount} (${typeof amount})`);

        // Add the validated ingredient to the processed array
        processedIngredients.push({
          materialId,
          amount
        });
      }

      console.log('API: All ingredients processed and validated:', processedIngredients);

      // Try to update the ingredients using the storage
      try {
        const updatedIngredients = await storage.updateRecipeIngredients(recipeId, processedIngredients);
        console.log(`API: Successfully updated ${updatedIngredients.length} ingredients`);
        res.json(updatedIngredients);
      } catch (storageError) {
        console.error('API: Storage error in updateRecipeIngredients:', storageError);
        throw storageError;
      }
    } catch (error) {
      console.error('API: Error in PUT /api/recipes/:id/ingredients:', error);
      res.status(500).json({
        message: "Error updating recipe ingredients",
        error: error instanceof Error ? error.message : String(error) // Already correct here, but good to double check context
      });
    }
  });

  // Stats routes
  app.get("/api/stats", async (req, res) => {
    try {
      console.log('Getting stats...');

      // Use direct SQLite queries for stats
      const sqlite3 = await import('sqlite3');
      const path = await import('path');
      const DB_PATH = path.resolve(process.cwd(), 'data', 'peony_cafe.db');

      // Create a promise-based query function
      const query = (sql: string, params: any[] = []): Promise<any> => { // Added types
        return new Promise((resolve, reject) => {
          const db = new sqlite3.default.Database(DB_PATH, (err) => {
            if (err) {
              console.error('Error opening database:', err);
              return reject(err);
            }

            db.get(sql, params, (err, row) => {
              db.close();
              if (err) {
                console.error('Error executing query:', err);
                return reject(err);
              }
              resolve(row);
            });
          });
        });
      };

      // Get materials count
      let materialCount = 0;
      try {
        const result = await query("SELECT COUNT(*) as count FROM materials");
        materialCount = result.count;
        console.log('Material count:', materialCount);
      } catch (err) {
        console.error('Error getting materials count:', err);
      }

      // Get recipes count
      let recipesCount = 0;
      try {
        const result = await query("SELECT COUNT(*) as count FROM recipes");
        recipesCount = result.count;
        console.log('Recipes count:', recipesCount);
      } catch (err) {
        console.error('Error getting recipes count:', err);
      }

      // Monthly sales is fixed for now
      const monthlySales = 28;
      console.log('Monthly sales:', monthlySales);

      res.json([
        {
          title: "تعداد مواد اولیه",
          value: materialCount,
          change: 15,
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fcd40d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/><path d="M12 19c-2 0-6-3-6-3v-7h12v7s-4 3-6 3z"/><path d="M12 12a2 2 0 0 0 0-4 2 2 0 0 0 0 4z"/></svg>'
        },
        {
          title: "تعداد رسپی‌ها",
          value: recipesCount,
          change: 8,
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fcd40d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v1"/><path d="M12 21v-1"/><path d="M19 12h1"/><path d="M4 12H3"/><path d="m18.364 5.636-.707.707"/><path d="m6.343 17.657-.707.707"/><path d="m5.636 5.636.707.707"/><path d="m17.657 17.657.707.707"/><circle cx="12" cy="12" r="4"/></svg>'
        },
        {
          title: "فروش ماهانه",
          value: `${monthlySales} م`,
          change: 12,
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fcd40d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'
        }
      ]);
    } catch (error) {
      console.error('Error in /api/stats:', error);
      res.status(500).json({ message: "Error fetching stats", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Sales Chart
  app.get("/api/sales/chart", async (req, res) => {
    try {
      // Return sample chart data
      res.json({
        labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
        datasets: [
          {
            label: 'فروش',
            data: [25.4, 28.7, 30.1, 29.8, 33.2, 35.6],
            borderColor: '#FCD40D',
            backgroundColor: 'rgba(252, 212, 13, 0.1)',
          },
          {
            label: 'هزینه‌ها',
            data: [18.2, 19.5, 21.3, 20.7, 22.8, 24.1],
            borderColor: '#FF6B6B',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
          }
        ]
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching chart data" });
    }
  });

  // Menu Items routes
  app.get("/api/menu-items", async (req, res) => {
    try {
      const menuItems = await storage.getMenuItems();
      res.json(menuItems);
    } catch (error) {
      console.error("Error in /api/menu-items:", error);
      res.status(500).json({ message: "Error fetching menu items" });
    }
  });

  // Orders routes
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Error fetching orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrderWithItems(id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Error fetching order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validation = insertOrderSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "داده‌های ورودی نامعتبر هستند",
          errors: validation.error.errors.map(err => `${err.path}: ${err.message}`).join(', ')
        });
      }

      const order = await storage.createOrder(validation.data);
      res.status(201).json(order);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error creating order:", errorMessage, error); // Log processed message and original error
      res.status(500).json({
        message: "خطا در ایجاد سفارش",
        details: errorMessage
      });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Updating order ${id} with data:`, req.body);

      // Validate partial schema
      const validationSchema = insertOrderSchema.partial();
      const validation = validationSchema.safeParse(req.body);

      if (!validation.success) {
        console.error('Order update validation error:', validation.error.errors);
        return res.status(400).json({
          message: "داده‌های ورودی نامعتبر هستند",
          errors: validation.error.errors.map(err => `${err.path}: ${err.message}`).join(', ')
        });
      }

      const updatedOrder = await storage.updateOrder(id, validation.data);

      if (!updatedOrder) {
        return res.status(404).json({ message: "سفارش مورد نظر یافت نشد" });
      }

      console.log(`Successfully updated order ${id}`);
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ 
        message: "خطا در به‌روزرسانی سفارش",
        details: errorMessage
      });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteOrder(id);

      if (!deleted) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting order" });
    }
  });

  // Order Items routes
  app.get("/api/orders/:orderId/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const orderItems = await storage.getOrderItems(orderId);
      res.json(orderItems);
    } catch (error) {
      res.status(500).json({ message: "Error fetching order items" });
    }
  });

  app.post("/api/order-items", async (req, res) => {
    try {
      const validation = insertOrderItemSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "داده‌های آیتم سفارش نامعتبر هستند",
          errors: validation.error.errors.map(err => `${err.path}: ${err.message}`).join(', ')
        });
      }

      const orderItem = await storage.addOrderItem(validation.data);
      res.status(201).json(orderItem);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error adding order item:", errorMessage, error); // Log processed message and original error
      res.status(500).json({
        message: "خطا در اضافه کردن آیتم سفارش",
        details: errorMessage
      });
    }
  });

  app.put("/api/order-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Validate partial schema
      const validationSchema = insertOrderItemSchema.partial();
      const validation = validationSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid input data",
          errors: validation.error.errors
        });
      }

      const updatedOrderItem = await storage.updateOrderItem(id, validation.data);

      if (!updatedOrderItem) {
        return res.status(404).json({ message: "Order item not found" });
      }

      res.json(updatedOrderItem);
    } catch (error) {
      res.status(500).json({ message: "Error updating order item" });
    }
  });

  app.delete("/api/order-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.removeOrderItem(id);

      if (!deleted) {
        return res.status(404).json({ message: "Order item not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting order item" });
    }
  });

  // Sales Summary routes
  app.get("/api/sales-summary", async (req, res) => {
    try {
      const salesSummary = await storage.getSalesSummary();
      res.json(salesSummary);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sales summary" });
    }
  });

  app.get("/api/sales-summary/:date", async (req, res) => {
    try {
      const date = req.params.date;
      const summary = await storage.getSalesSummaryByDate(date);

      if (!summary) {
        return res.status(404).json({ message: "Sales summary not found for this date" });
      }

      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sales summary" });
    }
  });

  // Invoice generation endpoint
  app.get("/api/orders/:id/invoice", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const orderItems = await storage.getOrderItems(orderId);

      // Generate HTML invoice
      const invoiceHtml = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>فاکتور فروش - ${order.orderNumber}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              direction: rtl;
            }
            .invoice {
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid #ddd;
              padding: 20px;
              border-radius: 5px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #008080;
              padding-bottom: 10px;
            }
            .header h1 {
              color: #008080;
              margin: 0;
            }
            .info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .items {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .items th, .items td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: center;
            }
            .items th {
              background-color: #f5f5f5;
            }
            .total {
              text-align: left;
              font-size: 1.2em;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <h1>کافه پونی</h1>
              <p>فاکتور فروش</p>
            </div>

            <div class="info">
              <div>
                <p><strong>شماره فاکتور:</strong> ${order.orderNumber}</p>
                <p><strong>تاریخ:</strong> ${order.jalaliDate}</p>
                <p><strong>ساعت:</strong> ${order.jalaliTime}</p>
              </div>
              <div>
                <p><strong>وضعیت پرداخت:</strong> ${order.isPaid ? 'پرداخت شده' : 'پرداخت نشده'}</p>
                <p><strong>روش پرداخت:</strong> ${order.paymentMethod || 'نقدی'}</p>
              </div>
            </div>

            <table class="items">
              <thead>
                <tr>
                  <th>نام محصول</th>
                  <th>قیمت واحد</th>
                  <th>تعداد</th>
                  <th>قیمت کل</th>
                </tr>
              </thead>
              <tbody>
                ${orderItems.map((item: OrderItem) => `
                  <tr>
                    <td>${item.menuItemName}</td>
                    <td>${formatPrice(item.price)}</td>
                    <td>${item.quantity}</td>
                    <td>${formatPrice(item.totalPrice)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="total">
              <p>جمع کل: ${formatPrice(order.totalAmount)} تومان</p>
            </div>

            <div class="footer">
              <p>با تشکر از خرید شما</p>
              <p>آدرس: تهران، خیابان ولیعصر، کوچه پونی</p>
              <p>تلفن: ۰۲۱-۱۲۳۴۵۶۷۸</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Set headers for PDF download
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.html`);

      res.send(invoiceHtml);
    } catch (error) {
      console.error('Error generating invoice:', error);
      res.status(500).json({ message: "Error generating invoice" });
    }
  });

  // Added for frontend compatibility: GET /api/order-items?orderId=...
  app.get("/api/order-items", async (req, res) => {
    console.log("[DEBUG] GET /api/order-items called with query:", req.query);
    try {
      const orderIdStr = req.query.orderId as string;
      const orderId = parseInt(orderIdStr);
      if (!orderIdStr || isNaN(orderId)) { // Check if orderIdStr is falsy or if parseInt results in NaN
        return res.status(400).json({ message: "Valid orderId is required" });
      }
      const items = await storage.getOrderItems(orderId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Error fetching order items" });
    }
  });

  // گزارش فروش بر اساس دسته‌بندی محصولات
  app.get('/api/sales/by-category', async (req, res) => {
    try {
      const data = await storage.getSalesByCategory();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching sales by category' });
    }
  });

  // گزارش فروش بر اساس ساعت (اوج فروش)
  app.get('/api/sales/by-hour', async (req, res) => {
    try {
      const data = await storage.getSalesByHour();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching sales by hour' });
    }
  });

  // گزارش پرفروش‌ترین و کم‌فروش‌ترین محصولات
  app.get('/api/sales/best-sellers', async (req, res) => {
    try {
      const limitStr = req.query.limit as string;
      const limit = limitStr ? parseInt(limitStr) : 5;
      const yearStr = req.query.year as string;
      const year = yearStr ? parseInt(yearStr) : undefined;
      const monthStr = req.query.month as string;
      const month = monthStr ? parseInt(monthStr) : undefined;
      const orderQueryParam = req.query.order as string;
      const order = orderQueryParam === 'asc' ? 'asc' : 'desc';
      const data = await storage.getBestSellingItems(limit, year, month, order);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching best selling items', error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/orders/clear-cache", async (req, res) => {
    try {
      const type = req.query.type as 'daily' | 'monthly' | 'yearly' | 'all' | undefined;
      let deletedCount = 0;
      if (!type || type === 'all') {
        // Delete all orders
        const orders = await storage.getOrders();
        for (const order of orders) {
          await storage.deleteOrder(order.id);
          deletedCount++;
        }
      } else {
        // Get Jalali date in YYYY-MM-DD
        const now = new Date();
        const { jy, jm, jd } = jalaali.toJalaali(now);
        const jalaliDate = `${jy}-${String(jm).padStart(2, '0')}-${String(jd).padStart(2, '0')}`;
        const orders = await storage.getOrders();
        if (type === 'daily') {
          for (const order of orders) {
            if (order.jalaliDate === jalaliDate) {
              await storage.deleteOrder(order.id);
              deletedCount++;
            }
          }
        } else if (type === 'monthly') {
          const monthPrefix = `${jy}-${String(jm).padStart(2, '0')}`;
          for (const order of orders) {
            if (order.jalaliDate.startsWith(monthPrefix)) {
              await storage.deleteOrder(order.id);
              deletedCount++;
            }
          }
        } else if (type === 'yearly') {
          const yearPrefix = `${jy}`;
          for (const order of orders) {
            if (order.jalaliDate.startsWith(yearPrefix)) {
              await storage.deleteOrder(order.id);
              deletedCount++;
            }
          }
        } else {
          return res.status(400).json({ message: 'نوع پاک‌سازی نامعتبر است.' });
        }
      }
      res.json({ message: 'پاک‌سازی کش سفارشات با موفقیت انجام شد.', deletedCount });
    } catch (error) {
      res.status(500).json({ message: 'خطا در پاک‌سازی کش سفارشات', error: error instanceof Error ? error.message : String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
