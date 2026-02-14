'use client';

import React, { Suspense } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { PantryProvider } from '@/app/context/PantryContext';
import { ShoppingProvider } from '@/app/context/ShoppingContext';
import { RecipesView } from '@/components/recipes';

const PantrySidebar = React.lazy(() => import('@/components/meals/PantrySidebar'));
const ShoppingListSidebar = React.lazy(() => import('@/components/meals/ShoppingListSidebar'));

export default function RecipesPage() {
  return (
    <AppLayout>
      <PantryProvider>
        <ShoppingProvider>
          <div className="h-full p-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <Suspense fallback={<div className="text-muted-foreground">Loading pantry...</div>}>
                <PantrySidebar />
              </Suspense>
              <Suspense fallback={<div className="text-muted-foreground">Loading shopping list...</div>}>
                <ShoppingListSidebar />
              </Suspense>
              <Suspense fallback={<div className="text-muted-foreground">Loading recipes...</div>}>
                <RecipesView />
              </Suspense>
            </div>
          </div>
        </ShoppingProvider>
      </PantryProvider>
    </AppLayout>
  );
}
