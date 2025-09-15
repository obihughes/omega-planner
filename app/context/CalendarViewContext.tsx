'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type CalendarViewMode = 'monthly' | 'yearly' | 'timeline';

interface CalendarViewContextType {
  viewMode: CalendarViewMode;
  setViewMode: (mode: CalendarViewMode) => void;
}

const CalendarViewContext = createContext<CalendarViewContextType | undefined>(undefined);

export function CalendarViewProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('yearly');

  return (
    <CalendarViewContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </CalendarViewContext.Provider>
  );
}

export function useCalendarView() {
  const context = useContext(CalendarViewContext);
  if (context === undefined) {
    throw new Error('useCalendarView must be used within a CalendarViewProvider');
  }
  return context;
} 