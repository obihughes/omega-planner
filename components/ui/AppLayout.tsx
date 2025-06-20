'use client';

import React, { useState } from 'react';
import { Navigation } from './Navigation';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
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
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
} 