'use client';

import React, { lazy, Suspense } from 'react';
import { Navigation } from '@/components/ui/Navigation';

// Lazy load the Documents component
const Documents = lazy(() => import('@/components/documents/Documents'));

export default function DocumentsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="p-4">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center h-96">
              <div className="text-muted-foreground">Loading documents...</div>
            </div>
          }>
            <Documents />
          </Suspense>
        </div>
      </main>
    </div>
  );
} 