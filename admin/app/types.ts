export interface Material {
  id: number;
  name: string;
  price: number;
  unit: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecipeIngredient {
  id?: number;
  recipeId?: number;
  materialId: number;
  amount: number;
  material?: Material;
}

export interface Recipe {
  id?: number;
  name: string;
  category: string;
  priceCoefficient: number;
  description?: string;
  costPrice?: number;
  sellPrice?: number;
  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string;
  ingredients?: RecipeIngredient[];
}

export interface InsertRecipe {
  name: string;
  category: string;
  priceCoefficient: number;
  description?: string;
}

export interface InsertRecipeIngredient {
  materialId: number;
  amount: number;
} 