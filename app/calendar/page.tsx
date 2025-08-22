'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { YearCalendar, MonthlyCalendar, MonthlyTimelineView } from '@/components/calendar';
import { useCalendarData } from '@/hooks/useCalendarData';
import { CalendarEvent, CalendarPeriod } from '@/types/calendar';
import { Settings, Download, RefreshCw, Trash2, Calendar, CalendarDays, List, Grid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCalendarView } from '@/app/context/CalendarViewContext';
import { useDailyPlanner } from '@/hooks/useDailyPlannerState';

type CalendarView = 'yearly' | 'monthly' | 'timeline';

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

  // Planner state for timeline view
  const {
    tasksByDate,
    poolTasks,
    pinnedTasks,
    getPoolTasksForDate,
    openEditModal,
    createPoolTask,
    handleAssignTask,
    handleUnassignTask,
    handleRescheduleTask,
    handleUpdateTask,
    isClient
  } = useDailyPlanner();

  const [showSettings, setShowSettings] = useState(false);
  const { viewMode: currentView, setViewMode: setCurrentView } = useCalendarView();

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
        {/* View Toggle */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Button
            variant={currentView === 'yearly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('yearly')}
            className="flex items-center gap-2"
          >
            <Grid className="w-4 h-4" />
            Year
          </Button>
          <Button
            variant={currentView === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('monthly')}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Monthly Grid
          </Button>
          <Button
            variant={currentView === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('timeline')}
            className="flex items-center gap-2"
          >
            <List className="w-4 h-4" />
            Timeline
          </Button>
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
        ) : currentView === 'timeline' ? (
          isClient && (
            <MonthlyTimelineView
              poolTasks={poolTasks}
              scheduledTasks={tasksByDate}
              pinnedTasks={pinnedTasks}
              onAssignTask={handleAssignTask}
              onUnassignTask={handleUnassignTask}
              onRescheduleTask={handleRescheduleTask}
              onUpdateTask={handleUpdateTask}
              getPoolTasksForDate={getPoolTasksForDate}
              openEditModal={openEditModal}
              createPoolTask={createPoolTask}
              onNavigateToDaily={(date) => {
                // Navigate to home page (daily planner) with the selected date
                // You could implement date-specific navigation here
                window.location.href = '/';
              }}
            />
          )
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