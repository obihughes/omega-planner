'use client';

import React from 'react';
import { DailyPlanner } from '@/components';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 p-4">
      <div className="max-w-7xl mx-auto">
        <DailyPlanner />
      </div>
    </main>
  );
} 