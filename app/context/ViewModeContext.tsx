'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ViewMode = 'daily' | 'weekly' | 'monthly' | 'focus';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isSchedulingMode: boolean;
  setIsSchedulingMode: (isScheduling: boolean) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [isSchedulingMode, setIsSchedulingMode] = useState(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('schedulingMode');
      return saved === 'true';
    }
    return false;
  });

  // Persist scheduling mode to localStorage
  const setIsSchedulingModeWithPersistence = (isScheduling: boolean) => {
    setIsSchedulingMode(isScheduling);
    if (typeof window !== 'undefined') {
      localStorage.setItem('schedulingMode', String(isScheduling));
    }
  };

  return (
    <ViewModeContext.Provider value={{ 
      viewMode, 
      setViewMode, 
      isSchedulingMode, 
      setIsSchedulingMode: setIsSchedulingModeWithPersistence 
    }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
} 