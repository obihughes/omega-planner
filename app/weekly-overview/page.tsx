'use client';

import React from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { GoalHierarchyView } from '@/components/goal-hierarchy';

export default function WeeklyOverviewPage() {
  return (
    <AppLayout>
      <div className="h-full w-full max-w-none">
        <GoalHierarchyView />
      </div>
    </AppLayout>
  );
}
