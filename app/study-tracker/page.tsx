'use client';

import React from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { StudyTracker } from '@/components/study-tracker';
import { StudyTrackerProvider } from '@/app/context/StudyTrackerContext';

export default function StudyTrackerPage() {
  return (
    <AppLayout>
      <StudyTrackerProvider>
        <div className="h-full w-full max-w-none">
          <StudyTracker />
        </div>
      </StudyTrackerProvider>
    </AppLayout>
  );
}
