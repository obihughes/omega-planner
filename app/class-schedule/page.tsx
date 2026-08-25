'use client';

import React, { lazy, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/ui/AppLayout';

const ClassSchedule = lazy(() => import('@/components/planner/ClassSchedule'));

function ClassScheduleFallback() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-muted-foreground">
        Loading class schedule...
      </div>
    </div>
  );
}

function ClassScheduleFromParams() {
  const params = useSearchParams();
  const showDailyTasks = params.get('showDailyTasks') === 'true';

  return (
    <Suspense fallback={<ClassScheduleFallback />}>
      <ClassSchedule initialShowDailyTasks={showDailyTasks} />
    </Suspense>
  );
}

export default function ClassSchedulePage() {
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col">
          <Suspense fallback={<ClassScheduleFallback />}>
            <ClassScheduleFromParams />
          </Suspense>
        </div>
      </div>
    </AppLayout>
  );
}
