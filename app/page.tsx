'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/ui/AppLayout';
import { dateFromDateKey } from '@/utils/dateUtils';
import { useViewMode } from '@/app/context/ViewModeContext';

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
      <div className="flex flex-col flex-1 min-h-0 h-full pl-4 pt-4 pb-4 pr-0">
        <div className="flex flex-col flex-1 min-h-0 w-full h-full">
          <DailyPlannerWrapper 
            Component={DailyPlanner} 
            paramsDate={params?.get('date') || undefined}
            paramsView={params?.get('view') || undefined}
          />
        </div>
      </div>
    </AppLayout>
  );
} 

function DailyPlannerWrapper({ Component, paramsDate, paramsView }: { Component: React.ComponentType; paramsDate?: string; paramsView?: string }) {
  const { setViewMode } = useViewMode();
  
  // Handle view mode from URL query param (?view=daily aliases to monthly for backward compatibility)
  useEffect(() => {
    if (paramsView === 'weekly' || paramsView === 'monthly') {
      setViewMode(paramsView);
    } else if (paramsView === 'daily') {
      setViewMode('monthly');
    }
  }, [paramsView, setViewMode]);
  
  // We pass the date via a global event to avoid tight coupling to the lazy component type
  useEffect(() => {
    if (!paramsDate) return;
    try {
      let date: Date | null = null;
      // If YYYY-MM-DD, build a local date to avoid UTC shift
      if (/^\d{4}-\d{2}-\d{2}$/.test(paramsDate)) {
        date = dateFromDateKey(paramsDate);
      } else {
        const parsed = new Date(paramsDate);
        if (!isNaN(parsed.getTime())) date = parsed;
      }
      if (date) {
        window.dispatchEvent(new CustomEvent('planner:navigate-to-date', { detail: { date } }));
      }
    } catch {}
  }, [paramsDate]);

  const C = Component as any;
  return <C />;
}