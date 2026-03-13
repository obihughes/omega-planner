'use client';

import React, { lazy, Suspense } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';

const ClassSchedule = lazy(() => import('@/components/planner/ClassSchedule'));

export default function ClassSchedulePage() {
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">
                  Loading class schedule...
                </div>
              </div>
            }
          >
            <ClassSchedule />
          </Suspense>
        </div>
      </div>
    </AppLayout>
  );
}
