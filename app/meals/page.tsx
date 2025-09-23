'use client';

import React, { Suspense } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { MealsProvider } from '@/app/context/MealsContext';
import { PantryProvider } from '@/app/context/PantryContext';
import { ShoppingProvider } from '@/app/context/ShoppingContext';

const MealsContent = React.lazy(() => import('@/components/meals/MealPlanner'));
const PantrySidebar = React.lazy(() => import('@/components/meals/PantrySidebar'));
const ShoppingListSidebar = React.lazy(() => import('@/components/meals/ShoppingListSidebar'));
const RecipesSidebar = React.lazy(() => import('@/components/meals/RecipesSidebar'));
import { getTodayDateKey } from '@/utils/dateUtils';

export default function MealsPage() {
  return (
    <AppLayout>
      <MealsProvider>
      <PantryProvider>
      <ShoppingProvider>
      <div className="h-full p-4 space-y-4">
        {/* Row 1: Show 3 days at a time with slide controls */}
        <div>
          <Suspense fallback={<div className="text-muted-foreground">Loading meals...</div>}>
            <MealsContent />
          </Suspense>
        </div>

        {/* Row 2: Pantry, Shopping List, and Recipes */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Suspense fallback={<div className="text-muted-foreground">Loading pantry...</div>}>
              <PantrySidebar dateKey={getTodayDateKey()} />
            </Suspense>
          </div>
          <div>
            <Suspense fallback={<div className="text-muted-foreground">Loading shopping list...</div>}>
              <ShoppingListSidebar dateKey={getTodayDateKey()} />
            </Suspense>
          </div>
          <div>
            <Suspense fallback={<div className="text-muted-foreground">Loading recipes...</div>}>
              <RecipesSidebar dateKey={getTodayDateKey()} />
            </Suspense>
          </div>
        </div>
      </div>
      </ShoppingProvider>
      </PantryProvider>
      </MealsProvider>
    </AppLayout>
  );
}


