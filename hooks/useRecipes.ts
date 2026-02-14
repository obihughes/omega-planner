'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RecipeItem } from '@/types/recipes';
import { RecipesStorage } from '@/utils/recipesStorage';
import { usePantryContext } from '@/app/context/PantryContext';
import { buildNormalizedNameSet, normalizeIngredientName } from '@/utils/ingredientUtils';

function rid() { return `recipe_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }

export function useRecipes() {
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const loaded = useRef(false);
  const lastSavedData = useRef<string>('');
  const { items } = usePantryContext();

  useEffect(() => { 
    const loadedRecipes = RecipesStorage.load(); 
    if (loadedRecipes.length === 0) {
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
      setRecipes(starterRecipes);
    } else {
      setRecipes(loadedRecipes);
    }
    // Seed lastSavedData so first save effect doesn't overwrite
    lastSavedData.current = JSON.stringify(loadedRecipes.length === 0 ? [] : loadedRecipes);
    loaded.current = true; 
  }, []);

  // Sync across tabs/windows when localStorage changes
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key && e.key !== 'omega-planner-recipes') return;
      const next = RecipesStorage.load();
      setRecipes(next);
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  useEffect(() => { 
    if (!loaded.current) return;
    const currentData = JSON.stringify(recipes);
    if (lastSavedData.current === currentData) return;
    RecipesStorage.save(recipes);
    lastSavedData.current = currentData;
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
    const now = new Date().toISOString();
    const recipe: RecipeItem = { ...data, id: rid(), createdAt: now, updatedAt: now };
    setRecipes(prev => [recipe, ...prev]);
    return recipe;
  }, []);

  const removeRecipe = useCallback((id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateRecipe = useCallback((id: string, updates: Partial<Omit<RecipeItem, 'id'>>) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r));
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

  return { recipes, addRecipe, removeRecipe, updateRecipe, canMake, matchPercent, cookable, suggestedTiered: suggested };
}


