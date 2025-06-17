'use client';

import React, { lazy, Suspense } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';

// Lazy load the Documents component
const Documents = lazy(() => import('@/components/documents/Documents'));

export default function DocumentsPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center h-96">
              <div className="text-muted-foreground">Loading documents...</div>
            </div>
          }>
            <Documents />
          </Suspense>
        </div>
      </div>
    </AppLayout>
  );
} 