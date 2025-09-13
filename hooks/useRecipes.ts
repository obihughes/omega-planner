'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Recipe } from '@/types/recipes';
import { RecipesStorage } from '@/utils/recipesStorage';

function generateId() {
  return `recipe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const initialLoadComplete = useRef(false);

  useEffect(() => {
    const loaded = RecipesStorage.load();
    
    // Add some default recipes if none exist
    if (loaded.length === 0) {
      const defaultRecipes: Recipe[] = [
        {
          id: generateId(),
          name: "Scrambled Eggs",
          description: "Quick and easy breakfast",
          ingredients: ["eggs", "butter", "salt", "pepper"],
          instructions: ["Heat butter in pan", "Scramble eggs", "Season with salt and pepper"],
          cookTime: 5,
          servings: 1,
          category: "breakfast",
          tags: ["quick", "protein"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: generateId(),
          name: "Pasta with Garlic Oil",
          description: "Simple Italian pasta dish",
          ingredients: ["pasta", "garlic", "olive oil", "parmesan", "salt"],
          instructions: ["Cook pasta", "Heat olive oil with garlic", "Toss pasta with oil", "Add parmesan"],
          cookTime: 15,
          servings: 2,
          category: "lunch",
          tags: ["vegetarian", "italian"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: generateId(),
          name: "Chicken Stir Fry",
          description: "Healthy dinner with vegetables",
          ingredients: ["chicken", "broccoli", "carrots", "soy sauce", "garlic", "rice"],
          instructions: ["Cook rice", "Stir fry chicken", "Add vegetables", "Season with soy sauce"],
          cookTime: 20,
          servings: 3,
          category: "dinner",
          tags: ["healthy", "protein"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setRecipes(defaultRecipes);
    } else {
      setRecipes(loaded);
    }
    
    initialLoadComplete.current = true;
  }, []);

  useEffect(() => {
    if (!initialLoadComplete.current) return;
    RecipesStorage.save(recipes);
  }, [recipes]);

  const addRecipe = useCallback((
    name: string, 
    description?: string, 
    ingredients?: string[], 
    instructions?: string[],
    cookTime?: number,
    servings?: number,
    category?: string,
    tags?: string[]
  ) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    
    const now = new Date().toISOString();
    const recipe: Recipe = {
      id: generateId(),
      name: trimmed,
      description: description?.trim() || undefined,
      ingredients: ingredients || [],
      instructions: instructions || [],
      cookTime,
      servings,
      category: category?.trim() || undefined,
      tags: tags || [],
      createdAt: now,
      updatedAt: now
    };
    
    setRecipes(prev => [recipe, ...prev]);
    return recipe;
  }, []);

  const removeRecipe = useCallback((id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateRecipe = useCallback((id: string, updates: Partial<Omit<Recipe, 'id'>>) => {
    setRecipes(prev => prev.map(r => 
      r.id === id 
        ? { ...r, ...updates, updatedAt: new Date().toISOString() } 
        : r
    ));
  }, []);

  // Helper function to check if a recipe can be made with available pantry items
  const canMakeRecipe = useCallback((recipe: Recipe, availableIngredients: Set<string>): boolean => {
    if (recipe.ingredients.length === 0) return false;
    return recipe.ingredients.every(ingredient => 
      availableIngredients.has(ingredient.trim().toLowerCase())
    );
  }, []);

  // Helper function to get missing ingredients for a recipe
  const getMissingIngredients = useCallback((recipe: Recipe, availableIngredients: Set<string>): string[] => {
    return recipe.ingredients.filter(ingredient => 
      !availableIngredients.has(ingredient.trim().toLowerCase())
    );
  }, []);

  // Get recipes that can be made with available ingredients
  const getCookableRecipes = useCallback((availableIngredients: Set<string>): Recipe[] => {
    return recipes.filter(recipe => canMakeRecipe(recipe, availableIngredients));
  }, [recipes, canMakeRecipe]);

  // Get recipe suggestions based on partial matches
  const getRecipeSuggestions = useCallback((availableIngredients: Set<string>, minMatchPercentage = 0.5): Recipe[] => {
    return recipes
      .map(recipe => {
        const totalIngredients = recipe.ingredients.length;
        if (totalIngredients === 0) return { recipe, matchPercentage: 0 };
        
        const matchedIngredients = recipe.ingredients.filter(ingredient =>
          availableIngredients.has(ingredient.trim().toLowerCase())
        ).length;
        
        const matchPercentage = matchedIngredients / totalIngredients;
        return { recipe, matchPercentage };
      })
      .filter(({ matchPercentage }) => matchPercentage >= minMatchPercentage)
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .map(({ recipe }) => recipe);
  }, [recipes]);

  return {
    recipes,
    addRecipe,
    removeRecipe,
    updateRecipe,
    canMakeRecipe,
    getMissingIngredients,
    getCookableRecipes,
    getRecipeSuggestions
  };
}
