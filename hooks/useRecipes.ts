'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RecipeItem, RecipeIngredient } from '@/types/recipes';
import { RecipesStorage } from '@/utils/recipesStorage';
import { usePantry } from './usePantry';

function rid() { return `recipe_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }

export function useRecipes() {
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const loaded = useRef(false);
  const { items } = usePantry();

  useEffect(() => { setRecipes(RecipesStorage.load()); loaded.current = true; }, []);
  useEffect(() => { if (loaded.current) RecipesStorage.save(recipes); }, [recipes]);

  const pantrySet = useMemo(() => new Set(items.map(i => i.name.toLowerCase())), [items]);

  const canMake = useCallback((r: RecipeItem) => {
    const req = r.ingredients.map(i => i.name.toLowerCase());
    if (req.length === 0) return false;
    return req.every(n => pantrySet.has(n));
  }, [pantrySet]);

  const matchPercent = useCallback((r: RecipeItem) => {
    const req = r.ingredients.map(i => i.name.toLowerCase());
    if (req.length === 0) return 0;
    const have = req.filter(n => pantrySet.has(n)).length;
    return Math.round((have / req.length) * 100);
  }, [pantrySet]);

  const addRecipe = useCallback((data: Omit<RecipeItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const recipe: RecipeItem = { ...data, id: rid(), createdAt: now, updatedAt: now };
    setRecipes(prev => [recipe, ...prev]);
    return recipe;
  }, []);

  const removeRecipe = useCallback((id: string) => setRecipes(prev => prev.filter(r => r.id !== id)), []);

  const updateRecipe = useCallback((id: string, updates: Partial<Omit<RecipeItem, 'id'>>) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r));
  }, []);

  const cookable = useMemo(() => recipes.filter(canMake), [recipes, canMake]);
  const suggested = useMemo(() => recipes.filter(r => !canMake(r) && matchPercent(r) >= 60).sort((a,b) => matchPercent(b) - matchPercent(a)), [recipes, canMake, matchPercent]);

  return { recipes, addRecipe, removeRecipe, updateRecipe, canMake, matchPercent, cookable, suggested };
}


