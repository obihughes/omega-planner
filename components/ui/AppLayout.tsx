'use client';

import React from 'react';
import { Navigation } from './Navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <Navigation />
      
      {/* Main Content Area */}
      <main className="flex-1 ml-48">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
} 