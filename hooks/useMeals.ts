'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MealItem, MealSlot, MealsBySlot, MEAL_SLOTS } from '@/types/meals';
import { MealsStorage, ensureMealsForDate } from '@/utils/mealsStorage';
import { getTodayDateKey } from '@/utils/dateUtils';

export interface UseMealsState {
  mealsByDate: Record<string, MealsBySlot>;
  getMeals(dateKey: string, slot: MealSlot): MealItem[];
  addMeal(dateKey: string, slot: MealSlot, name: string, notes?: string, ingredients?: string[]): MealItem | null;
  removeMeal(dateKey: string, slot: MealSlot, id: string): void;
  updateMeal(dateKey: string, slot: MealSlot, id: string, updates: Partial<Omit<MealItem, 'id'>>): void;
  clearDay(dateKey: string): void;
}

function generateId(): string {
  return `meal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useMeals(): UseMealsState {
  const [mealsByDate, setMealsByDate] = useState<Record<string, MealsBySlot>>({});
  const initialLoadComplete = useRef(false);

  useEffect(() => {
    const loaded = MealsStorage.load();
    setMealsByDate(loaded);
    initialLoadComplete.current = true;
  }, []);

  useEffect(() => {
    if (!initialLoadComplete.current) return;
    MealsStorage.save(mealsByDate);
  }, [mealsByDate]);

  const getMeals = useCallback((dateKey: string, slot: MealSlot): MealItem[] => {
    const d = mealsByDate[dateKey];
    if (!d) return [];
    return d[slot] || [];
  }, [mealsByDate]);

  const addMeal = useCallback((dateKey: string, slot: MealSlot, name: string, notes?: string, ingredients?: string[]): MealItem | null => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const now = new Date().toISOString();
    const item: MealItem = {
      id: generateId(),
      name: trimmed,
      notes: notes?.trim() || undefined,
      ingredients: ingredients || undefined,
      createdAt: now,
      updatedAt: now
    };
    setMealsByDate(prev => {
      const next = { ...prev };
      const day = ensureMealsForDate(next, dateKey);
      day[slot] = [...day[slot], item];
      return next;
    });
    return item;
  }, []);

  const removeMeal = useCallback((dateKey: string, slot: MealSlot, id: string) => {
    setMealsByDate(prev => {
      const next = { ...prev };
      const day = ensureMealsForDate(next, dateKey);
      day[slot] = day[slot].filter(m => m.id !== id);
      return next;
    });
  }, []);

  const updateMeal = useCallback((dateKey: string, slot: MealSlot, id: string, updates: Partial<Omit<MealItem, 'id'>>) => {
    setMealsByDate(prev => {
      const next = { ...prev };
      const day = ensureMealsForDate(next, dateKey);
      day[slot] = day[slot].map(m => m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m);
      return next;
    });
  }, []);

  const clearDay = useCallback((dateKey: string) => {
    setMealsByDate(prev => {
      const next = { ...prev };
      next[dateKey] = {
        breakfast: [],
        lunch: [],
        dinner: []
      };
      return next;
    });
  }, []);

  return {
    mealsByDate,
    getMeals,
    addMeal,
    removeMeal,
    updateMeal,
    clearDay
  };
}


