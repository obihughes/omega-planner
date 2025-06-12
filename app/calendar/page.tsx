'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { YearCalendar } from '@/components/calendar/YearCalendar';
import { useCalendarData } from '@/hooks/useCalendarData';
import { CalendarEvent, CalendarPeriod } from '@/types/calendar';
import { Calendar, Settings, Download, Upload, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  const handleExport = () => {
    const dataStr = exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `omega-calendar-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading calendar...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              Calendar
            </h1>
            <p className="text-muted-foreground">
              Your personal calendar with period highlighting and event management
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 bg-card border rounded-lg p-4">
            <h3 className="font-semibold mb-4 text-foreground">Calendar Settings</h3>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
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
                variant="outline"
                size="sm"
                onClick={clearAllData}
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Data
              </Button>
            </div>
          </div>
        )}



        {/* Calendar Component */}
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


      </div>
    </div>
  );
} 