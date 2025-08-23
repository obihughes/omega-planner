'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';

export default function Home() {
  const [DailyPlanner, setDailyPlanner] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadComponent = async () => {
      try {
        const LoadedComponent = await import('@/components/planner/DailyPlanner');
        setDailyPlanner(() => LoadedComponent.default);
      } catch (error) {
        console.error('Failed to load DailyPlanner:', error);
      } finally {
        setLoading(false);
      }
    };

    loadComponent();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="px-6 pb-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-96">
              <div className="text-muted-foreground">Loading planner...</div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!DailyPlanner) {
    return (
      <AppLayout>
        <div className="px-6 pb-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-96">
              <div className="text-red-500">Failed to load planner</div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-full p-4">
        <div className="max-w-7xl mx-auto h-full">
          <DailyPlanner />
        </div>
      </div>
    </AppLayout>
  );
} 