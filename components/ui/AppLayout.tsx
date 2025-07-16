'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { Button } from './button';
import { Sun, Moon } from 'lucide-react';

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
  const { theme, toggleTheme } = useTheme();

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
        "flex-1 transition-all duration-300 ease-in-out relative",
        isNavigationCollapsed ? "ml-20" : "ml-48"
      )}>
        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
} 