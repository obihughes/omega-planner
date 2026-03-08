'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useStudyTracker } from '@/hooks/useStudyTracker';

type StudyTrackerContextValue = ReturnType<typeof useStudyTracker>;

const StudyTrackerContext = createContext<StudyTrackerContextValue | undefined>(undefined);

export function StudyTrackerProvider({ children }: { children: ReactNode }) {
  const value = useStudyTracker();
  return (
    <StudyTrackerContext.Provider value={value}>
      {children}
    </StudyTrackerContext.Provider>
  );
}

export function useStudyTrackerContext() {
  const context = useContext(StudyTrackerContext);
  if (context === undefined) {
    throw new Error('useStudyTrackerContext must be used within a StudyTrackerProvider');
  }
  return context;
}
