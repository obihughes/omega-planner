'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/ui/AppLayout';

export default function Home() {
  const [DailyPlanner, setDailyPlanner] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useSearchParams();

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
          <DailyPlannerWrapper Component={DailyPlanner} paramsDate={params?.get('date') || undefined} />
        </div>
      </div>
    </AppLayout>
  );
} 

function DailyPlannerWrapper({ Component, paramsDate }: { Component: React.ComponentType; paramsDate?: string }) {
  // We pass the date via a global event to avoid tight coupling to the lazy component type
  useEffect(() => {
    if (!paramsDate) return;
    try {
      const date = new Date(paramsDate);
      if (!isNaN(date.getTime())) {
        window.dispatchEvent(new CustomEvent('planner:navigate-to-date', { detail: { date } }));
      }
    } catch {}
  }, [paramsDate]);

  const C = Component as any;
  return <C />;
}