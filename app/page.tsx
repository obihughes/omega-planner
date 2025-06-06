'use client';

import React, { lazy, Suspense } from 'react';

// Lazy load the heavy DailyPlanner component
const DailyPlanner = lazy(() => import('@/components/planner/DailyPlanner'));
import { Navigation } from '@/components/ui/Navigation';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="p-4">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center h-96">
              <div className="text-muted-foreground">Loading planner...</div>
            </div>
          }>
            <DailyPlanner />
          </Suspense>
        </div>
      </main>
    </div>
  );
} 