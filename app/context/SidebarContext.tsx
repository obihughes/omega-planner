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
  // Initialize state with localStorage values if available
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedCollapsed = localStorage.getItem('sidebarCollapsed');
      return savedCollapsed !== null ? JSON.parse(savedCollapsed) : false;
    }
    return false;
  });
  
  const [sidebarWidth, setSidebarWidthState] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedWidth = localStorage.getItem('sidebarWidth');
      if (savedWidth) {
        return Math.max(minWidth, Math.min(maxWidth, parseInt(savedWidth, 10)));
      }
    }
    return initialWidth;
  });

  // Only adjust width if it's outside the new bounds
  useEffect(() => {
    const currentWidth = sidebarWidth;
    const boundedWidth = Math.max(minWidth, Math.min(maxWidth, currentWidth));
    if (currentWidth !== boundedWidth) {
      setSidebarWidthState(boundedWidth);
      localStorage.setItem('sidebarWidth', boundedWidth.toString());
    }
  }, [minWidth, maxWidth, sidebarWidth]);

  const toggleSidebar = () => {
    setIsCollapsed((prev: boolean) => {
      const newCollapsed = !prev;
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsed));
      return newCollapsed;
    });
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