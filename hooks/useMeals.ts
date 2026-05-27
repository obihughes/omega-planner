'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { MealIngredient, MealItem } from '@/types/meals';
import { MealsStorage } from '@/utils/mealsStorage';

const STORAGE_KEY = 'omega-planner-meals-v1';

export type MealInput = {
  name: string;
  ingredients: MealIngredient[];
};

export function useMeals() {
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const skipInitialSave = useRef(true);

  useEffect(() => {
    setMeals(MealsStorage.load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (skipInitialSave.current) {
      skipInitialSave.current = false;
      return;
    }
    MealsStorage.save(meals);
  }, [meals]);

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key && e.key !== STORAGE_KEY) return;
      setMeals(MealsStorage.load());
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const add = useCallback((input: MealInput) => {
    const name = input.name.trim();
    if (!name) return null;
    const ingredients = input.ingredients
      .map((i) => ({
        name: i.name.trim(),
        quantity: i.quantity?.trim() || undefined,
      }))
      .filter((i) => i.name.length > 0);
    const now = new Date().toISOString();
    const meal: MealItem = {
      id: nanoid(),
      name,
      ingredients,
      createdAt: now,
      updatedAt: now,
    };
    setMeals((prev) => [meal, ...prev]);
    return meal;
  }, []);

  const update = useCallback((id: string, input: Partial<MealInput>) => {
    setMeals((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const name = input.name !== undefined ? input.name.trim() : m.name;
        const ingredients =
          input.ingredients !== undefined
            ? input.ingredients
                .map((i) => ({
                  name: i.name.trim(),
                  quantity: i.quantity?.trim() || undefined,
                }))
                .filter((i) => i.name.length > 0)
            : m.ingredients;
        return {
          ...m,
          name: name || m.name,
          ingredients,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const remove = useCallback((id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return {
    meals,
    hydrated,
    add,
    update,
    remove,
  };
}
