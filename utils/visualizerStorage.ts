import { CalendarPeriod } from '@/types/calendar';
import { generateId } from '@/utils/calendar';
import { getDateKey, dateFromDateKey } from '@/utils/dateUtils';

const STORAGE_KEY = 'omega-visualizer-data-v1';

export interface VisualizerData {
  periods: CalendarPeriod[];
}

export const loadVisualizerData = (): VisualizerData => {
  if (typeof window === 'undefined') return { periods: [] };
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { periods: [] };
    
    const parsed = JSON.parse(saved);
    return {
      periods: Array.isArray(parsed.periods) 
        ? parsed.periods.map((p: any) => ({
            ...p,
            startDate: p.startDateKey ? dateFromDateKey(p.startDateKey) : new Date(p.startDate),
            endDate: p.endDateKey ? dateFromDateKey(p.endDateKey) : new Date(p.endDate)
          }))
        : []
    };
  } catch (error) {
    console.error('Error loading visualizer data:', error);
    return { periods: [] };
  }
};

export const saveVisualizerData = (data: VisualizerData) => {
  if (typeof window === 'undefined') return;
  
  try {
    const storagePayload = {
      periods: data.periods.map(p => ({
        ...p,
        startDateKey: p.startDateKey || getDateKey(p.startDate),
        endDateKey: p.endDateKey || getDateKey(p.endDate)
      }))
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storagePayload));
  } catch (error) {
    console.error('Error saving visualizer data:', error);
  }
};

