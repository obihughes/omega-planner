'use client';

import React from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { DailyLogView } from '@/components/dailyLog';

export default function DailyLogPage() {
  return (
    <AppLayout>
      <div className="h-full w-full max-w-none">
        <DailyLogView />
      </div>
    </AppLayout>
  );
}
