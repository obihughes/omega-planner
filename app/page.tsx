'use client';

import React, { lazy, Suspense } from 'react';

// Lazy load the heavy DailyPlanner component
const DailyPlanner = lazy(() => import('@/components/planner/DailyPlanner'));
import { AppLayout } from '@/components/ui/AppLayout';

export default function Home() {
  return (
    <AppLayout>
      <div className="px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center h-96">
              <div className="text-muted-foreground">Loading planner...</div>
            </div>
          }>
            <DailyPlanner />
          </Suspense>
        </div>
      </div>
    </AppLayout>
  );
} 