'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the heavy DailyPlanner component (client-side only)
const DailyPlanner = dynamic(() => import('@/components/planner/DailyPlanner'), { ssr: false });
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