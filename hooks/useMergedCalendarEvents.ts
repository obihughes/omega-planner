'use client';

import { useMemo } from 'react';
import type { CalendarData } from '@/types/calendar';
import { useCalendarData } from './useCalendarData';
import { usePrimaryGoalCalendarEvents } from './usePrimaryGoalCalendarEvents';

/**
 * Single source of truth for "calendar + primary weekly goals" as read-only display data.
 *
 * - `events` / `mergedData` include derived primary-goal events (never persisted).
 * - `data` stays the raw stored calendar data. Export, import and CRUD must use this,
 *   otherwise derived goal events would be written back into calendar storage.
 *
 * Everything else from `useCalendarData` (addEvent, updateEvent, exportData, ...) is passed through unchanged.
 */
export function useMergedCalendarEvents() {
  const calendar = useCalendarData();
  const primaryGoalEvents = usePrimaryGoalCalendarEvents();

  const mergedData = useMemo<CalendarData>(
    () => ({
      events: primaryGoalEvents.length > 0 ? [...calendar.data.events, ...primaryGoalEvents] : calendar.data.events,
      periods: calendar.data.periods,
    }),
    [calendar.data.events, calendar.data.periods, primaryGoalEvents]
  );

  return {
    ...calendar,
    mergedData,
    events: mergedData.events,
  };
}
