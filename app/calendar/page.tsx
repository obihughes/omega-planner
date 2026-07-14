'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { YearCalendar, MonthlyCalendar, MonthlyTimelineView, WeeklyGoalsCalendarView } from '@/components/calendar';
import { StudyTracker } from '@/components/study-tracker';
import { StudyTrackerProvider } from '@/app/context/StudyTrackerContext';
import { useCalendarData } from '@/hooks/useCalendarData';
import { CalendarEvent, CalendarPeriod } from '@/types/calendar';
import { Settings, Download, RefreshCw, Trash2, Target, BookOpen, CalendarRange, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCalendarView, type CalendarViewMode } from '@/app/context/CalendarViewContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDailyPlanner } from '@/hooks/useDailyPlannerState';

type CalendarView = 'yearly' | 'monthly' | 'timeline' | 'weekly-goals';
type WeeklyPageMode = 'weekly-overview' | 'study-tracker';

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
  const [weeklyPageMode, setWeeklyPageMode] = useState<WeeklyPageMode>('weekly-overview');
  const { viewMode: currentView, setViewMode: setCurrentView } = useCalendarView();
  const params = useSearchParams();
  const router = useRouter();

  const switchCalendarView = (mode: 'monthly' | 'yearly') => {
    setCurrentView(mode);
    const dateParam = params?.get('date');
    const query = new URLSearchParams({ view: mode });
    if (dateParam) query.set('date', dateParam);
    router.replace(`/calendar?${query.toString()}`);
  };

  // Respect ?view=monthly|yearly|timeline|weekly-goals from query params; default to monthly
  useEffect(() => {
    const v = params?.get('view');
    if (v === 'weekly-goals') {
      router.replace('/weekly-overview');
      return;
    }
    if (v === 'monthly' || v === 'yearly' || v === 'timeline') {
      setCurrentView(v as CalendarViewMode);
      return;
    }
    setCurrentView('monthly');
    const dateParam = params?.get('date');
    const query = new URLSearchParams({ view: 'monthly' });
    if (dateParam) query.set('date', dateParam);
    router.replace(`/calendar?${query.toString()}`);
  }, [params, setCurrentView, router]);
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
        <div className="flex flex-col flex-1 min-h-0 h-full">
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-overlay">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Loading calendar...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const calendarContent = (
      <div className={`mx-auto px-4 py-6 ${currentView === 'weekly-goals' ? 'w-full max-w-none' : 'max-w-7xl'}`}>
        {(currentView === 'monthly' || currentView === 'yearly') && (
          <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border flex items-center gap-1.5 p-3 max-w-5xl mx-auto">
            <Button
              variant={currentView === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => switchCalendarView('monthly')}
              className="h-8 px-3 gap-1.5 text-xs"
            >
              <CalendarRange className="w-3.5 h-3.5" />
              Month
            </Button>
            <Button
              variant={currentView === 'yearly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => switchCalendarView('yearly')}
              className="h-8 px-3 gap-1.5 text-xs"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Year
            </Button>
          </div>
        )}

        {/* Calendar Component */}
        {currentView === 'monthly' ? (
          <MonthlyCalendar
            data={data}
            onEventAdd={handleEventAdd}
            onEventEdit={handleEventEdit}
            onEventDelete={deleteEvent}
            className="bg-background max-w-5xl mx-auto"
            onNavigateToDaily={(date) => {
              // Navigate to home page daily planner with a local-safe YYYY-MM-DD date key
              try {
                const d = new Date(date);
                d.setHours(0, 0, 0, 0);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const dateKey = `${year}-${month}-${day}`;
                window.location.href = `/?date=${dateKey}`;
              } catch {
                window.location.href = `/`;
              }
            }}
            initialDate={initialDateFromQuery}
          />
        ) : currentView === 'weekly-goals' ? (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/50 mb-0">
              <Button
                variant={weeklyPageMode === 'weekly-overview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWeeklyPageMode('weekly-overview')}
                className="h-8 px-3 gap-1.5 text-xs"
              >
                <Target className="w-3.5 h-3.5" />
                Weekly Overview
              </Button>
              <Button
                variant={weeklyPageMode === 'study-tracker' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWeeklyPageMode('study-tracker')}
                className="h-8 px-3 gap-1.5 text-xs"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Study Tracker
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              {weeklyPageMode === 'weekly-overview' ? (
                <WeeklyGoalsCalendarView
                  calendarData={data}
                  onNavigateToDaily={(date) => {
                    try {
                      const d = new Date(date);
                      d.setHours(0, 0, 0, 0);
                      const year = d.getFullYear();
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      const dateKey = `${year}-${month}-${day}`;
                      window.location.href = `/?date=${dateKey}`;
                    } catch {
                      window.location.href = `/`;
                    }
                  }}
                />
              ) : (
                <StudyTrackerProvider>
                  <StudyTracker />
                </StudyTrackerProvider>
              )}
            </div>
          </div>
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
  );

  return (
    <AppLayout>
      <div className="flex flex-col flex-1 min-h-0 h-full">
        {currentView === 'timeline' ? (
          isClient && (
            <div className="flex-1 min-h-0 h-full">
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
                onNavigateToDaily={() => {
                  window.location.href = '/';
                }}
              />
            </div>
          )
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-overlay">
            {calendarContent}
          </div>
        )}
      </div>
    </AppLayout>
  );
} 