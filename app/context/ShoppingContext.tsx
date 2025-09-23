'use client';

import React, { createContext, useContext } from 'react';
import { useShopping } from '@/hooks/useShopping';

type ShoppingContextValue = ReturnType<typeof useShopping>;

const ShoppingContext = createContext<ShoppingContextValue | undefined>(undefined);

export const ShoppingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const shopping = useShopping();
  return (
    <ShoppingContext.Provider value={shopping}>{children}</ShoppingContext.Provider>
  );
};

export function useShoppingContext(): ShoppingContextValue {
  const ctx = useContext(ShoppingContext);
  if (ctx === undefined) {
    throw new Error('useShoppingContext must be used within a ShoppingProvider');
  }
  return ctx;
}






