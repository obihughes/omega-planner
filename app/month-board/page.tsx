'use client';

import React from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { MonthBoard } from '@/components/month-board';

export default function MonthBoardPage() {
  return (
    <AppLayout>
      <div className="h-full w-full min-h-0 overflow-hidden">
        <MonthBoard />
      </div>
    </AppLayout>
  );
}
