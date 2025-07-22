'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  sidebarWidth: number;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ 
  children, 
  initialWidth = 160, 
  minWidth = 140, 
  maxWidth = 320 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidthState] = useState(initialWidth);

  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
      setSidebarWidthState(Math.max(minWidth, Math.min(maxWidth, parseInt(savedWidth, 10))));
    }
  }, [minWidth, maxWidth]);

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  const setSidebarWidth = (width: number) => {
    const newWidth = Math.max(minWidth, Math.min(maxWidth, width));
    setSidebarWidthState(newWidth);
    localStorage.setItem('sidebarWidth', newWidth.toString());
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, sidebarWidth, toggleSidebar, setSidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  );
}; 