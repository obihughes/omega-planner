'use client';

import React from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { AppMapView } from '@/components/app-map';

export default function AppMapPage() {
  return (
    <AppLayout>
      <AppMapView />
    </AppLayout>
  );
}
