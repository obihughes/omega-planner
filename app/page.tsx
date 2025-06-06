'use client';

import React from 'react';
import { DailyPlanner } from '@/components';
import { Navigation } from '@/components/ui/Navigation';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="p-4">
        <div className="max-w-7xl mx-auto">
          <DailyPlanner />
        </div>
      </main>
    </div>
  );
} 