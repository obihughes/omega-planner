'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { CalendarData, CalendarEvent, CalendarPeriod } from '@/types/calendar';
import { generateId } from '@/utils/calendar';
import { getDateKey, dateFromDateKey } from '@/utils/dateUtils';

const STORAGE_KEY = 'omega-calendar-data';
const STORAGE_VERSION = '2.0.0';

const EMPTY_DATA: CalendarData = { events: [], periods: [] };

// Sample data used only by Reset to Default
const defaultData: CalendarData = {
  events: [
    {
      id: 'event1',
      title: 'Team Meeting',
      date: new Date(2024, 0, 15),
      color: '#3b82f6',
      type: 'event',
      description: 'Weekly team sync'
    },
    {
      id: 'event2',
      title: 'Project Deadline',
      date: new Date(2024, 1, 28),
      color: '#ef4444',
      type: 'event',
      description: 'Final project submission'
    },
    {
      id: 'event3',
      title: 'Conference',
      date: new Date(2024, 2, 10),
      color: '#8b5cf6',
      type: 'event',
      description: 'Tech conference'
    }
  ],
  periods: [
    {
      id: 'period1',
      title: 'Winter Break',
      startDate: new Date(2024, 0, 20),
      endDate: new Date(2024, 0, 30),
      color: '#06b6d4',
      type: 'period',
      description: 'Company winter break'
    },
    {
      id: 'period2',
      title: 'Sprint 1',
      startDate: new Date(2024, 1, 1),
      endDate: new Date(2024, 1, 14),
      color: '#10b981',
      type: 'period',
      description: 'Development sprint'
    },
    {
      id: 'period3',
      title: 'Vacation',
      startDate: new Date(2024, 2, 15),
      endDate: new Date(2024, 2, 22),
      color: '#f59e0b',
      type: 'period',
      description: 'Personal vacation'
    }
  ]
};

function parseCalendarData(raw: string | null): CalendarData {
  if (!raw) return EMPTY_DATA;
  try {
    const parsed = JSON.parse(raw);
    return {
      events: Array.isArray(parsed.events)
        ? parsed.events.map((event: any) => {
            const dateKey: string | undefined = event.dateKey || (event.date ? getDateKey(event.date) : undefined);
            const date: Date = dateKey ? dateFromDateKey(dateKey) : new Date(event.date);
            return {
              ...event,
              date,
              dateKey,
            } as CalendarEvent;
          })
        : [],
      periods: Array.isArray(parsed.periods)
        ? parsed.periods.map((period: any) => {
            const startDateKey: string | undefined = period.startDateKey || (period.startDate ? getDateKey(period.startDate) : undefined);
            const endDateKey: string | undefined = period.endDateKey || (period.endDate ? getDateKey(period.endDate) : undefined);
            const startDate: Date = startDateKey ? dateFromDateKey(startDateKey) : new Date(period.startDate);
            const endDate: Date = endDateKey ? dateFromDateKey(endDateKey) : new Date(period.endDate);
            return {
              ...period,
              startDate,
              endDate,
              startDateKey,
              endDateKey,
            } as CalendarPeriod;
          })
        : [],
    };
  } catch (error) {
    console.error('Error loading calendar data:', error);
    return EMPTY_DATA;
  }
}

function serializeCalendarData(data: CalendarData): string {
  return JSON.stringify({
    version: STORAGE_VERSION,
    events: data.events.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      notes: e.notes,
      color: e.color,
      type: e.type,
      dateKey: e.dateKey || getDateKey(e.date),
    })),
    periods: data.periods.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      notes: p.notes,
      color: p.color,
      type: p.type,
      startDateKey: p.startDateKey || getDateKey(p.startDate),
      endDateKey: p.endDateKey || getDateKey(p.endDate),
    })),
  });
}

let cachedRaw: string | null | undefined;
let cachedData: CalendarData = EMPTY_DATA;
const listeners = new Set<() => void>();

function getSnapshot(): CalendarData {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY_DATA;
  }
  if (cachedRaw === raw) return cachedData;
  cachedRaw = raw;
  cachedData = parseCalendarData(raw);
  return cachedData;
}

function getServerSnapshot(): CalendarData {
  return EMPTY_DATA;
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function persist(next: CalendarData) {
  try {
    const serialized = serializeCalendarData(next);
    localStorage.setItem(STORAGE_KEY, serialized);
    cachedRaw = serialized;
    cachedData = next;
  } catch (error) {
    console.error('Error saving calendar data:', error);
    cachedData = next;
  }
  listeners.forEach((listener) => listener());
}

export function useCalendarData() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setData = useCallback((updater: CalendarData | ((prev: CalendarData) => CalendarData)) => {
    const prev = getSnapshot();
    const next = typeof updater === 'function' ? updater(prev) : updater;
    persist(next);
  }, []);

  const addEvent = useCallback((eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: generateId(),
      date: new Date(eventData.date)
    };

    setData(prev => ({
      ...prev,
      events: [...prev.events, newEvent]
    }));

    return newEvent;
  }, [setData]);

  const updateEvent = useCallback((eventId: string, eventData: Partial<CalendarEvent>) => {
    setData(prev => ({
      ...prev,
      events: prev.events.map(event =>
        event.id === eventId
          ? {
              ...event,
              ...eventData,
              ...(eventData.date && { dateKey: getDateKey(eventData.date) })
            }
          : event
      )
    }));
  }, [setData]);

  const deleteEvent = useCallback((eventId: string) => {
    setData(prev => ({
      ...prev,
      events: prev.events.filter(event => event.id !== eventId)
    }));
  }, [setData]);

  const addPeriod = useCallback((periodData: Omit<CalendarPeriod, 'id'>) => {
    const newPeriod: CalendarPeriod = {
      ...periodData,
      id: generateId(),
      startDate: new Date(periodData.startDate),
      endDate: new Date(periodData.endDate)
    };

    setData(prev => ({
      ...prev,
      periods: [...prev.periods, newPeriod]
    }));

    return newPeriod;
  }, [setData]);

  const updatePeriod = useCallback((periodId: string, periodData: Partial<CalendarPeriod>) => {
    setData(prev => ({
      ...prev,
      periods: prev.periods.map(period =>
        period.id === periodId
          ? {
              ...period,
              ...periodData,
              ...(periodData.startDate && { startDateKey: getDateKey(periodData.startDate) }),
              ...(periodData.endDate && { endDateKey: getDateKey(periodData.endDate) })
            }
          : period
      )
    }));
  }, [setData]);

  const deletePeriod = useCallback((periodId: string) => {
    setData(prev => ({
      ...prev,
      periods: prev.periods.filter(period => period.id !== periodId)
    }));
  }, [setData]);

  const clearAllData = useCallback(() => {
    setData({ events: [], periods: [] });
  }, [setData]);

  const resetToDefault = useCallback(() => {
    setData(defaultData);
  }, [setData]);

  const importData = useCallback((newData: CalendarData) => {
    const processedData: CalendarData = {
      events: newData.events.map(event => {
        const date = event.date ? new Date(event.date) : (event as any).dateKey ? dateFromDateKey((event as any).dateKey) : new Date();
        return {
          ...event,
          id: event.id || generateId(),
          date,
        } as CalendarEvent;
      }),
      periods: newData.periods.map(period => {
        const startDate = period.startDate ? new Date(period.startDate) : (period as any).startDateKey ? dateFromDateKey((period as any).startDateKey) : new Date();
        const endDate = period.endDate ? new Date(period.endDate) : (period as any).endDateKey ? dateFromDateKey((period as any).endDateKey) : new Date();
        return {
          ...period,
          id: period.id || generateId(),
          startDate,
          endDate,
        } as CalendarPeriod;
      })
    };

    setData(processedData);
  }, [setData]);

  const exportData = useCallback(() => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  return {
    data,
    isLoading: false,
    addEvent,
    updateEvent,
    deleteEvent,
    addPeriod,
    updatePeriod,
    deletePeriod,
    clearAllData,
    resetToDefault,
    importData,
    exportData
  };
}
