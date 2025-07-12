'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('navCollapsed') === 'true';
    }
    return true; // Default to collapsed
  });

  // Persist collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('navCollapsed', String(isNavigationCollapsed));
    }
  }, [isNavigationCollapsed]);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <Navigation 
        isCollapsed={isNavigationCollapsed}
        onToggleCollapse={setIsNavigationCollapsed}
      />
      
      {/* Main Content Area */}
      <main className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        isNavigationCollapsed ? "ml-16" : "ml-48"
      )}>
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
} 