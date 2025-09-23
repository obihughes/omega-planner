'use client';

import React, { createContext, useContext } from 'react';
import { useMeals, UseMealsState } from '@/hooks/useMeals';

interface MealsContextValue extends UseMealsState {}

const MealsContext = createContext<MealsContextValue | undefined>(undefined);

export const MealsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const meals = useMeals();
  return (
    <MealsContext.Provider value={meals}>
      {children}
    </MealsContext.Provider>
  );
};

export function useMealsContext(): MealsContextValue {
  const ctx = useContext(MealsContext);
  if (ctx === undefined) {
    throw new Error('useMealsContext must be used within a MealsProvider');
  }
  return ctx;
}






