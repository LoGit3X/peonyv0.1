export interface Recipe {
  id: number;
  name: string;
  category: string;
  description?: string;
  imageUrl?: string;
  priceCoefficient: number;
  costPrice: number;
  sellPrice: number;
  createdAt?: string;
  updatedAt?: string;
  rawPrice?: number;
  basePrice?: number; 
  finalPrice?: number;
}

export interface RecipeIngredient {
  id: number;
  recipeId: number;
  materialId: number;
  amount: number;
  material?: Material;
}

export interface Material {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
} 