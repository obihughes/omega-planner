'use client';

import React from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { FiveYearVisualizer } from '@/components/visualizer';
import { useVisualizerData } from '@/hooks/useVisualizerData';
import { RefreshCw } from 'lucide-react';

export default function VisualizerPage() {
  const {
    periods,
    isLoading,
    addPeriod,
    updatePeriod,
    deletePeriod
  } = useVisualizerData();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading visualizer...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <FiveYearVisualizer 
        periods={periods}
        onPeriodAdd={addPeriod}
        onPeriodEdit={updatePeriod}
        onPeriodDelete={deletePeriod}
      />
    </AppLayout>
  );
}
