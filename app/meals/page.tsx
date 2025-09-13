'use client';

import React, { Suspense } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';

const MealsContent = React.lazy(() => import('@/components/meals/MealPlanner'));
const PantrySidebar = React.lazy(() => import('@/components/meals/PantrySidebar'));
const ShoppingListSidebar = React.lazy(() => import('@/components/meals/ShoppingListSidebar'));

export default function MealsPage() {
  return (
    <AppLayout>
      <div className="h-full p-4 space-y-4">
        {/* Row 1: Show 3 days at a time with slide controls */}
        <div>
          <Suspense fallback={<div className="text-muted-foreground">Loading meals...</div>}>
            <MealsContent />
          </Suspense>
        </div>

        {/* Row 2: Pantry and Shopping List side-by-side */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div>
            <Suspense fallback={<div className="text-muted-foreground">Loading pantry...</div>}>
              <PantrySidebar dateKey={new Date().toISOString().slice(0,10)} />
            </Suspense>
          </div>
          <div>
            <Suspense fallback={<div className="text-muted-foreground">Loading shopping list...</div>}>
              <ShoppingListSidebar dateKey={new Date().toISOString().slice(0,10)} />
            </Suspense>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}


