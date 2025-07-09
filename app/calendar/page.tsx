'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { YearCalendar, MonthlyCalendar } from '@/components/calendar';
import { useCalendarData } from '@/hooks/useCalendarData';
import { CalendarEvent, CalendarPeriod } from '@/types/calendar';
import { Settings, Download, RefreshCw, Trash2, Calendar, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CalendarView = 'yearly' | 'monthly';

export default function CalendarPage() {
  const {
    data,
    isLoading,
    addEvent,
    addPeriod,
    updateEvent,
    updatePeriod,
    deleteEvent,
    deletePeriod,
    clearAllData,
    resetToDefault,
    exportData
  } = useCalendarData();

  const [showSettings, setShowSettings] = useState(false);
  const [currentView, setCurrentView] = useState<CalendarView>('monthly');

  const handleEventAdd = (eventData: Omit<CalendarEvent, 'id'>) => {
    addEvent(eventData);
  };

  const handlePeriodAdd = (periodData: Omit<CalendarPeriod, 'id'>) => {
    addPeriod(periodData);
  };

  const handleEventEdit = (event: CalendarEvent) => {
    updateEvent(event.id, event);
  };

  const handlePeriodEdit = (period: CalendarPeriod) => {
    updatePeriod(period.id, period);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading calendar...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header with View Switcher */}
        <div className="mb-6 bg-card border border-border rounded-lg shadow-sm overflow-hidden p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={currentView === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('monthly')}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Monthly
              </Button>
              <Button
                variant={currentView === 'yearly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('yearly')}
                className="flex items-center gap-2"
              >
                <CalendarDays className="w-4 h-4" />
                Yearly
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Component */}
        {currentView === 'monthly' ? (
          <MonthlyCalendar
            data={data}
            onEventAdd={handleEventAdd}
            onPeriodAdd={handlePeriodAdd}
            onEventEdit={handleEventEdit}
            onPeriodEdit={handlePeriodEdit}
            onEventDelete={deleteEvent}
            onPeriodDelete={deletePeriod}
            className="bg-background"
          />
        ) : (
          <YearCalendar
            data={data}
            onEventAdd={handleEventAdd}
            onPeriodAdd={handlePeriodAdd}
            onEventEdit={handleEventEdit}
            onPeriodEdit={handlePeriodEdit}
            onEventDelete={deleteEvent}
            onPeriodDelete={deletePeriod}
            className="bg-background"
          />
        )}

        {/* Settings Section */}
        <div className="mt-12 pt-8 border-t">
            <div className="flex justify-center">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center gap-2"
                >
                    <Settings className="w-4 h-4" />
                    {showSettings ? 'Hide' : 'Show'} Settings
                </Button>
            </div>

            {showSettings && (
              <div className="mt-6 bg-card border rounded-lg p-4 max-w-2xl mx-auto">
                <h3 className="font-semibold mb-4 text-foreground text-center">Calendar Settings</h3>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportData}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Data
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetToDefault}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset to Default
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={clearAllData}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All Data
                  </Button>
                </div>
              </div>
            )}
        </div>
      </div>
    </AppLayout>
  );
} 