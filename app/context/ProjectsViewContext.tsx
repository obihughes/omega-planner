'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ProjectsViewMode = 'active' | 'archived' | 'calendar' | 'tasks';

interface ProjectsViewContextType {
  viewMode: ProjectsViewMode;
  setViewMode: (mode: ProjectsViewMode) => void;
}

const ProjectsViewContext = createContext<ProjectsViewContextType | undefined>(undefined);

export function ProjectsViewProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ProjectsViewMode>('active');

  return (
    <ProjectsViewContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ProjectsViewContext.Provider>
  );
}

export function useProjectsView() {
  const context = useContext(ProjectsViewContext);
  if (context === undefined) {
    throw new Error('useProjectsView must be used within a ProjectsViewProvider');
  }
  return context;
} 