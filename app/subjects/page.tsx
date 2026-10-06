'use client';

import React from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { SubjectsPage } from '@/components/subjects';

export default function SubjectsRoutePage() {
  return (
    <AppLayout>
      <div className="h-full w-full max-w-none">
        <SubjectsPage />
      </div>
    </AppLayout>
  );
}
