'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarPeriod } from '@/types/calendar';
import { generateId } from '@/utils/calendar';
import { loadVisualizerData, saveVisualizerData } from '@/utils/visualizerStorage';

export function useVisualizerData() {
  const [periods, setPeriods] = useState<CalendarPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const data = loadVisualizerData();
    setPeriods(data.periods);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveVisualizerData({ periods });
    }
  }, [periods, isLoading]);

  const addPeriod = useCallback((periodData: Omit<CalendarPeriod, 'id'>) => {
    const newPeriod: CalendarPeriod = {
      ...periodData,
      id: generateId()
    };
    setPeriods(prev => [...prev, newPeriod]);
    return newPeriod;
  }, []);

  const updatePeriod = useCallback((periodId: string, periodData: Partial<CalendarPeriod>) => {
    setPeriods(prev => prev.map(p => 
      p.id === periodId ? { ...p, ...periodData } : p
    ));
  }, []);

  const deletePeriod = useCallback((periodId: string) => {
    setPeriods(prev => prev.filter(p => p.id !== periodId));
  }, []);

  return {
    periods,
    isLoading,
    addPeriod,
    updatePeriod,
    deletePeriod
  };
}

