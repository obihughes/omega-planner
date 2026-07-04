'use client';

import React, { useMemo } from 'react';
import { Navigation } from './Navigation';
import { cn } from '@/lib/utils';
import { SidebarProvider, useSidebar } from '@/app/context/SidebarContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayoutContent: React.FC<AppLayoutProps> = ({ children }) => {
  const { isCollapsed, sidebarWidth } = useSidebar();

  // Calculate collapsed width to match Navigation component
  const collapsedWidth = useMemo(() => {
    const proportion = Math.max(100, Math.min(180, sidebarWidth * 0.55));
    return Math.floor(proportion);
  }, [sidebarWidth]);

  return (
    <div className="flex h-screen bg-background">
      <Navigation />
      
      <main 
        className="flex flex-col flex-1 min-h-0 relative overflow-hidden"
        style={{ marginLeft: isCollapsed ? `${collapsedWidth}px` : `${sidebarWidth}px` }}
      >
        <div className="flex flex-col flex-1 min-h-0 h-full">
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