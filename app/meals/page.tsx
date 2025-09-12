'use client';

import React, { Suspense } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';

const MealsContent = React.lazy(() => import('@/components/meals/MealPlanner'));
const PantrySidebar = React.lazy(() => import('@/components/meals/PantrySidebar'));
const ShoppingListSidebar = React.lazy(() => import('@/components/meals/ShoppingListSidebar'));

export default function MealsPage() {
  return (
    <AppLayout>
      <div className="h-full p-4">
        <div className="max-w-7xl mx-auto h-full grid grid-cols-12 gap-4">
          <div className="col-span-8">
            <Suspense fallback={<div className="text-muted-foreground">Loading meals...</div>}>
              <MealsContent />
            </Suspense>
          </div>
          <div className="col-span-2 space-y-4">
            <Suspense fallback={<div className="text-muted-foreground">Loading pantry...</div>}>
              <PantrySidebar dateKey={new Date().toISOString().slice(0,10)} />
            </Suspense>
          </div>
          <div className="col-span-2">
            <Suspense fallback={<div className="text-muted-foreground">Loading shopping list...</div>}>
              <ShoppingListSidebar dateKey={new Date().toISOString().slice(0,10)} />
            </Suspense>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}


