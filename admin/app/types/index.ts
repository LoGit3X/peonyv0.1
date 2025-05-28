export interface Material {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Recipe {
  id: number;
  name: string;
  category: string;
  description?: string;
  imageUrl?: string;
  costPrice: number;
  sellPrice: number;
  createdAt?: string;
  updatedAt?: string;
  ingredients?: RecipeIngredient[];
}

export interface RecipeIngredient {
  id: number;
  recipeId: number;
  materialId: number;
  amount: number;
  material?: Material;
} 