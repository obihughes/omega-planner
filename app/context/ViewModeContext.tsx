'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type ViewMode = 'daily' | 'weekly' | 'monthly';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isSchedulingMode: boolean;
  setIsSchedulingMode: (isScheduling: boolean) => void;
  isTodayMode: boolean;
  setIsTodayMode: (isToday: boolean) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);
  const [isTodayMode, setIsTodayMode] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration and load from localStorage after component mounts
  useEffect(() => {
    setIsHydrated(true);
    
    // Load from localStorage only after hydration
    const savedSchedulingMode = localStorage.getItem('schedulingMode');
    const savedTodayMode = localStorage.getItem('todayMode');
    
    if (savedSchedulingMode === 'true') {
      setIsSchedulingMode(true);
    }
    
    if (savedTodayMode === 'true') {
      setIsTodayMode(true);
    }
  }, []);

  // Persist scheduling mode to localStorage
  const setIsSchedulingModeWithPersistence = (isScheduling: boolean) => {
    setIsSchedulingMode(isScheduling);
    if (isHydrated) {
      localStorage.setItem('schedulingMode', String(isScheduling));
    }
  };

  // Persist today mode to localStorage
  const setIsTodayModeWithPersistence = (isToday: boolean) => {
    setIsTodayMode(isToday);
    if (isHydrated) {
      localStorage.setItem('todayMode', String(isToday));
    }
  };

  return (
    <ViewModeContext.Provider value={{ 
      viewMode, 
      setViewMode, 
      isSchedulingMode, 
      setIsSchedulingMode: setIsSchedulingModeWithPersistence,
      isTodayMode,
      setIsTodayMode: setIsTodayModeWithPersistence
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