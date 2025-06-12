'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { YearCalendar } from '@/components/calendar/YearCalendar';
import { useCalendarData } from '@/hooks/useCalendarData';
import { CalendarEvent, CalendarPeriod } from '@/types/calendar';
import { Settings, Download, RefreshCw, Trash2, Plus } from 'lucide-react';
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

  const headerRightControls = (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => addEvent({ title: 'New Event', date: new Date(), color: '#3b82f6', type: 'event' })}
        size="sm"
        className="flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Event
      </Button>
      
      <Button
        variant="outline"
        onClick={() => addPeriod({ title: 'New Period', startDate: new Date(), endDate: new Date(), color: '#10b981', type: 'period' })}
        size="sm"
        className="flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Period
      </Button>
    </div>
  );

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
          headerRightControls={headerRightControls}
        />

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
    </div>
  );
} 