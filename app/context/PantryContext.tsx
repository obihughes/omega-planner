'use client';

import React, { createContext, useContext } from 'react';
import { usePantry } from '@/hooks/usePantry';

type PantryContextValue = ReturnType<typeof usePantry>;

const PantryContext = createContext<PantryContextValue | undefined>(undefined);

export const PantryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pantry = usePantry();
  return (
    <PantryContext.Provider value={pantry}>{children}</PantryContext.Provider>
  );
};

export function usePantryContext(): PantryContextValue {
  const ctx = useContext(PantryContext);
  if (ctx === undefined) {
    throw new Error('usePantryContext must be used within a PantryProvider');
  }
  return ctx;
}







