'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarData, CalendarEvent, CalendarPeriod } from '@/types/calendar';
import { generateId } from '@/utils/calendar';

const STORAGE_KEY = 'omega-calendar-data';

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

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Convert date strings back to Date objects
        const processedData: CalendarData = {
          events: parsed.events.map((event: any) => ({
            ...event,
            date: new Date(event.date)
          })),
          periods: parsed.periods.map((period: any) => ({
            ...period,
            startDate: new Date(period.startDate),
            endDate: new Date(period.endDate)
          }))
        };
        setData(processedData);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
          ? { ...event, ...eventData, date: eventData.date ? new Date(eventData.date) : event.date }
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
          ? { 
              ...period, 
              ...periodData,
              startDate: periodData.startDate ? new Date(periodData.startDate) : period.startDate,
              endDate: periodData.endDate ? new Date(periodData.endDate) : period.endDate
            }
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
    // Process imported data to ensure dates are Date objects
    const processedData: CalendarData = {
      events: newData.events.map(event => ({
        ...event,
        id: event.id || generateId(),
        date: new Date(event.date)
      })),
      periods: newData.periods.map(period => ({
        ...period,
        id: period.id || generateId(),
        startDate: new Date(period.startDate),
        endDate: new Date(period.endDate)
      }))
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