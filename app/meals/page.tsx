'use client';

import React, { Suspense } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';

const MealsContent = React.lazy(() => import('@/components/meals/MealPlanner'));

export default function MealsPage() {
  return (
    <AppLayout>
      <Suspense fallback={
        <div className="px-6 pb-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-96">
              <div className="text-muted-foreground">Loading meals...</div>
            </div>
          </div>
        </div>
      }>
        <MealsContent />
      </Suspense>
    </AppLayout>
  );
}


