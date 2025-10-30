'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarData, CalendarEvent, CalendarPeriod } from '@/types/calendar';
import { generateId } from '@/utils/calendar';
import { getDateKey, dateFromDateKey } from '@/utils/dateUtils';

const STORAGE_KEY = 'omega-calendar-data';
const STORAGE_VERSION = '2.0.0';

// Default sample data
const defaultData: CalendarData = {
  events: [
    {
      id: 'event1',
      title: 'Team Meeting',
      date: new Date(2024, 0, 15), // Jan 15, 2024
      color: '#3b82f6',
      type: 'event',
      description: 'Weekly team sync'
    },
    {
      id: 'event2',
      title: 'Project Deadline',
      date: new Date(2024, 1, 28), // Feb 28, 2024
      color: '#ef4444',
      type: 'event',
      description: 'Final project submission'
    },
    {
      id: 'event3',
      title: 'Conference',
      date: new Date(2024, 2, 10), // Mar 10, 2024
      color: '#8b5cf6',
      type: 'event',
      description: 'Tech conference'
    }
  ],
  periods: [
    {
      id: 'period1',
      title: 'Winter Break',
      startDate: new Date(2024, 0, 20), // Jan 20, 2024
      endDate: new Date(2024, 0, 30), // Jan 30, 2024
      color: '#06b6d4',
      type: 'period',
      description: 'Company winter break'
    },
    {
      id: 'period2',
      title: 'Sprint 1',
      startDate: new Date(2024, 1, 1), // Feb 1, 2024
      endDate: new Date(2024, 1, 14), // Feb 14, 2024
      color: '#10b981',
      type: 'period',
      description: 'Development sprint'
    },
    {
      id: 'period3',
      title: 'Vacation',
      startDate: new Date(2024, 2, 15), // Mar 15, 2024
      endDate: new Date(2024, 2, 22), // Mar 22, 2024
      color: '#f59e0b',
      type: 'period',
      description: 'Personal vacation'
    }
  ]
};

export function useCalendarData() {
  const [data, setData] = useState<CalendarData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on mount (supports legacy ISO and new YYYY-MM-DD keys)
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        const processedData: CalendarData = {
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
        setData(processedData);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save data to localStorage whenever it changes (persist as YYYY-MM-DD keys)
  useEffect(() => {
    if (!isLoading) {
      try {
        const storagePayload = {
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
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storagePayload));
      } catch (error) {
        console.error('Error saving calendar data:', error);
      }
    }
  }, [data, isLoading]);

  // Event CRUD operations
  const addEvent = useCallback((eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: generateId(),
      date: new Date(eventData.date) // Ensure it's a Date object
    };

    setData(prev => ({
      ...prev,
      events: [...prev.events, newEvent]
    }));

    return newEvent;
  }, []);

  const updateEvent = useCallback((eventId: string, eventData: Partial<CalendarEvent>) => {
    setData(prev => ({
      ...prev,
      events: prev.events.map(event => 
        event.id === eventId 
          ? { ...event, ...eventData }
          : event
      )
    }));
  }, []);

  const deleteEvent = useCallback((eventId: string) => {
    setData(prev => ({
      ...prev,
      events: prev.events.filter(event => event.id !== eventId)
    }));
  }, []);

  // Period CRUD operations
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
  }, []);

  const updatePeriod = useCallback((periodId: string, periodData: Partial<CalendarPeriod>) => {
    setData(prev => ({
      ...prev,
      periods: prev.periods.map(period => 
        period.id === periodId 
          ? { ...period, ...periodData }
          : period
      )
    }));
  }, []);

  const deletePeriod = useCallback((periodId: string) => {
    setData(prev => ({
      ...prev,
      periods: prev.periods.filter(period => period.id !== periodId)
    }));
  }, []);

  // Utility functions
  const clearAllData = useCallback(() => {
    setData({ events: [], periods: [] });
  }, []);

  const resetToDefault = useCallback(() => {
    setData(defaultData);
  }, []);

  const importData = useCallback((newData: CalendarData) => {
    // Process imported data to ensure dates are Date objects (support keys)
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
  }, []);

  const exportData = useCallback(() => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  return {
    data,
    isLoading,
    // Event operations
    addEvent,
    updateEvent,
    deleteEvent,
    // Period operations
    addPeriod,
    updatePeriod,
    deletePeriod,
    // Utility operations
    clearAllData,
    resetToDefault,
    importData,
    exportData
  };
} 