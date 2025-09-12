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
        {/* Row 1: Always show 7 days side-by-side using fixed 7-column grid at >=xl; fewer columns on small screens */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          <div className="xl:col-span-7 col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4">
            <Suspense fallback={<div className="text-muted-foreground">Loading meals...</div>}>
              <MealsContent />
            </Suspense>
          </div>
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


