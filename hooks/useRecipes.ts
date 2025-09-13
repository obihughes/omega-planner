'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RecipeItem, RecipeIngredient } from '@/types/recipes';
import { RecipesStorage } from '@/utils/recipesStorage';
import { usePantry } from './usePantry';
import { buildNormalizedNameSet, normalizeIngredientName } from '@/utils/ingredientUtils';

function rid() { return `recipe_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }

export function useRecipes() {
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const loaded = useRef(false);
  const lastSavedData = useRef<string>('');
  const { items } = usePantry();

  useEffect(() => { 
    console.log('🧑‍🍳 useRecipes: Loading initial data from storage...');
    const loadedRecipes = RecipesStorage.load(); 
    console.log('🧑‍🍳 useRecipes: Loaded initial data:', loadedRecipes);
    if (loadedRecipes.length === 0) {
      console.log('🧑‍🍳 useRecipes: No recipes found, creating starter recipes...');
      // Add starter recipes
      const starters = [
        { name: 'Scrambled Eggs', ingredients: [{ name: 'eggs' }, { name: 'butter' }, { name: 'salt' }] },
        { name: 'Pasta with Garlic Oil', ingredients: [{ name: 'pasta' }, { name: 'garlic' }, { name: 'olive oil' }] },
        { name: 'Chicken Stir Fry', ingredients: [{ name: 'chicken' }, { name: 'vegetables' }, { name: 'soy sauce' }] },
        { name: 'Grilled Cheese', ingredients: [{ name: 'bread' }, { name: 'cheese' }, { name: 'butter' }] },
        { name: 'Pancakes', ingredients: [{ name: 'flour' }, { name: 'eggs' }, { name: 'milk' }, { name: 'sugar' }] }
      ];
      const now = new Date().toISOString();
      const starterRecipes = starters.map(s => ({ ...s, id: rid(), createdAt: now, updatedAt: now }));
      console.log('🧑‍🍳 useRecipes: Created starter recipes:', starterRecipes);
      setRecipes(starterRecipes);
    } else {
      setRecipes(loadedRecipes);
    }
    // Seed lastSavedData so first save effect doesn't overwrite
    lastSavedData.current = JSON.stringify(loadedRecipes.length === 0 ? [] : loadedRecipes);
    loaded.current = true; 
    console.log('🧑‍🍳 useRecipes: Initial load completed');
  }, []);
  useEffect(() => { 
    console.log('🧑‍🍳 useRecipes: Save effect triggered with recipes:', recipes);
    if (!loaded.current) {
      console.log('🧑‍🍳 useRecipes: Skipping save - not loaded yet');
      return;
    }
    
    // Prevent saving the same data multiple times
    const currentData = JSON.stringify(recipes);
    if (lastSavedData.current === currentData) {
      console.log('🧑‍🍳 useRecipes: Skipping save - data unchanged');
      return;
    }
    
    console.log('🧑‍🍳 useRecipes: Saving recipes to storage:', recipes);
    RecipesStorage.save(recipes);
    lastSavedData.current = currentData;
    console.log('🧑‍🍳 useRecipes: Save completed');
  }, [recipes]);

  const pantrySet = useMemo(() => new Set(items.map(i => i.name.toLowerCase())), [items]);
  const normalizedPantry = useMemo(() => buildNormalizedNameSet(items.map(i => i.name)), [items]);

  const canMake = useCallback((r: RecipeItem) => {
    const req = r.ingredients.map(i => i.name);
    if (req.length === 0) return false;
    return req.every(n => normalizedPantry.has(normalizeIngredientName(n)));
  }, [normalizedPantry]);

  const matchPercent = useCallback((r: RecipeItem) => {
    const req = r.ingredients.map(i => i.name);
    if (req.length === 0) return 0;
    const have = req.filter(n => normalizedPantry.has(normalizeIngredientName(n))).length;
    return Math.round((have / req.length) * 100);
  }, [normalizedPantry]);

  const addRecipe = useCallback((data: Omit<RecipeItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('🧑‍🍳 useRecipes.addRecipe called with:', data);
    const now = new Date().toISOString();
    const recipe: RecipeItem = { ...data, id: rid(), createdAt: now, updatedAt: now };
    console.log('🧑‍🍳 useRecipes.addRecipe: Created recipe:', recipe);
    setRecipes(prev => {
      console.log('🧑‍🍳 useRecipes.addRecipe: Current recipes before add:', prev);
      const next = [recipe, ...prev];
      console.log('🧑‍🍳 useRecipes.addRecipe: New recipes array:', next);
      return next;
    });
    return recipe;
  }, []);

  const removeRecipe = useCallback((id: string) => {
    console.log('🧑‍🍳 useRecipes.removeRecipe called with id:', id);
    setRecipes(prev => {
      const filtered = prev.filter(r => r.id !== id);
      console.log('🧑‍🍳 useRecipes.removeRecipe: Filtered recipes:', filtered);
      return filtered;
    });
  }, []);

  const updateRecipe = useCallback((id: string, updates: Partial<Omit<RecipeItem, 'id'>>) => {
    console.log('🧑‍🍳 useRecipes.updateRecipe called with:', { id, updates });
    setRecipes(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r);
      console.log('🧑‍🍳 useRecipes.updateRecipe: Updated recipes:', updated);
      return updated;
    });
  }, []);

  const cookable = useMemo(() => recipes.filter(canMake), [recipes, canMake]);
  
  // Multiple suggestion tiers based on match percentage
  const suggested = useMemo(() => {
    const nonCookable = recipes.filter(r => !canMake(r));
    return {
      high: nonCookable.filter(r => matchPercent(r) >= 75).sort((a,b) => matchPercent(b) - matchPercent(a)),
      medium: nonCookable.filter(r => matchPercent(r) >= 50 && matchPercent(r) < 75).sort((a,b) => matchPercent(b) - matchPercent(a)),
      low: nonCookable.filter(r => matchPercent(r) >= 25 && matchPercent(r) < 50).sort((a,b) => matchPercent(b) - matchPercent(a))
    };
  }, [recipes, canMake, matchPercent]);

  // Legacy suggested for backwards compatibility
  const suggestedLegacy = useMemo(() => recipes.filter(r => !canMake(r) && matchPercent(r) >= 60).sort((a,b) => matchPercent(b) - matchPercent(a)), [recipes, canMake, matchPercent]);

  return { recipes, addRecipe, removeRecipe, updateRecipe, canMake, matchPercent, cookable, suggested, suggestedTiered: suggested, suggestedLegacy };
}


