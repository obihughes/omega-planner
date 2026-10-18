'use client';

import { useEffect, useState } from 'react';
import type { CalendarEvent } from '@/types/calendar';
import { GoalsStorage } from '@/utils/goalsStorage';
import { dateFromDateKey } from '@/utils/dateUtils';
import { getGoalColorHex } from '@/components/weekly-goals/goalColors';

const WEEKLY_GOALS_STORAGE_KEY = 'omega-planner-weekly-goals-v1';
export const PRIMARY_GOAL_EVENT_PREFIX = 'primary-goal:';

/**
 * Builds read-only calendar events from Weekly Overview goals marked as primary.
 * Nothing is written to calendar storage; the list is derived from weekly goals on every load.
 */
export function usePrimaryGoalCalendarEvents(): CalendarEvent[] {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    function load() {
      const all = GoalsStorage.loadAll();
      const result: CalendarEvent[] = [];

      for (const week of Object.values(all.weeks)) {
        for (const [dateKey, goals] of Object.entries(week.goalsByDate)) {
          for (const goal of goals) {
            if (goal.goalType !== 'primary') continue;
            const title = goal.title.trim();
            if (!title) continue;

            result.push({
              id: `${PRIMARY_GOAL_EVENT_PREFIX}${goal.id}`,
              title,
              description: goal.notes,
              notes: goal.notes,
              date: dateFromDateKey(dateKey),
              dateKey,
              color: getGoalColorHex(goal.color),
              type: 'event',
              source: 'primary-goal',
              readOnly: true,
            });
          }
        }
      }

      setEvents(result);
    }

    load();

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== WEEKLY_GOALS_STORAGE_KEY) return;
      load();
    }

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', load);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', load);
    };
  }, []);

  return events;
}
