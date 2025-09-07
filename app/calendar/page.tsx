'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { YearCalendar, MonthlyCalendar, MonthlyTimelineView } from '@/components/calendar';
import { useCalendarData } from '@/hooks/useCalendarData';
import { CalendarEvent, CalendarPeriod } from '@/types/calendar';
import { Settings, Download, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCalendarView } from '@/app/context/CalendarViewContext';
import { useSearchParams } from 'next/navigation';
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
    handleDeleteTask,
    handleAssignTask,
    handleUnassignTask,
    handleRescheduleTask,
    handleUpdateTask,
    isClient
  } = useDailyPlanner();

  const [showSettings, setShowSettings] = useState(false);
  const { viewMode: currentView, setViewMode: setCurrentView } = useCalendarView();
  const params = useSearchParams();
  
  // Respect ?view=monthly|yearly|timeline from query params
  useEffect(() => {
    const v = params?.get('view');
    if (v === 'monthly' || v === 'yearly' || v === 'timeline') {
      setCurrentView(v as CalendarView);
    }
  }, [params, setCurrentView]);
  const initialDateFromQuery = useMemo(() => {
    const d = params?.get('date');
    if (d) {
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return undefined;
  }, [params]);

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
        {/* View toggle removed; navigation handled in main sidebar */}

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
            className="bg-background max-w-5xl mx-auto"
            compact
            onNavigateToDaily={(date) => {
              // Navigate to home page daily planner for the selected date using query param
              const d = new Date(date);
              d.setHours(0,0,0,0);
              const iso = d.toISOString().slice(0,10);
              window.location.href = `/?date=${iso}`;
            }}
            initialDate={initialDateFromQuery}
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
              onDeleteTask={(task) => handleDeleteTask(task.id)}
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
            isVisible={currentView === 'yearly'}
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