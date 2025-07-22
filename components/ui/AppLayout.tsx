'use client';

import React from 'react';
import { Navigation } from './Navigation';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { Button } from './button';
import { Sun, Moon } from 'lucide-react';
import { SidebarProvider, useSidebar } from '@/app/context/SidebarContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayoutContent: React.FC<AppLayoutProps> = ({ children }) => {
  const { isCollapsed, sidebarWidth } = useSidebar();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen bg-background">
      <Navigation />
      
      <main 
        className="flex-1 transition-all duration-300 ease-in-out relative"
        style={{ marginLeft: isCollapsed ? '80px' : `${sidebarWidth}px` }}
      >
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

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
} 