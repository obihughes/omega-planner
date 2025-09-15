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
  // Hydration-safe initial state; apply saved values after mount
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidthState] = useState(initialWidth);

  // After mount, load saved sidebar state from localStorage
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem('sidebarCollapsed');
      if (savedCollapsed !== null) {
        setIsCollapsed(JSON.parse(savedCollapsed));
      }
      const savedWidth = localStorage.getItem('sidebarWidth');
      if (savedWidth) {
        const parsed = parseInt(savedWidth, 10);
        const bounded = Math.max(minWidth, Math.min(maxWidth, parsed));
        setSidebarWidthState(bounded);
      }
    } catch {}
  }, [minWidth, maxWidth]);

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