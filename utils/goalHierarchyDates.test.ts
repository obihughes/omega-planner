import {
  getNextWeekStartKey,
  getWeekContextForDate,
  getWeekdayDates,
  getWeeksInMonth,
} from './goalHierarchyDates';
import { GoalHierarchyStorage } from './goalHierarchyStorage';
import {
  GOAL_HIERARCHY_PRIMARY_ROW_COUNT,
  GOAL_HIERARCHY_PREVIEW_ROW_COUNT,
  GOAL_HIERARCHY_WEEKDAY_COUNT,
} from '../types/goalHierarchy';

describe('goalHierarchyDates', () => {
  it('returns seven Mon–Sun dates for a week', () => {
    const dates = getWeekdayDates('2026-06-22');
    expect(dates).toHaveLength(GOAL_HIERARCHY_WEEKDAY_COUNT);
    expect(dates[0]).toBe('2026-06-22');
    expect(dates[4]).toBe('2026-06-26');
    expect(dates[5]).toBe('2026-06-27');
    expect(dates[6]).toBe('2026-06-28');
  });

  it('computes next week start as +7 days', () => {
    expect(getNextWeekStartKey('2026-06-22')).toBe('2026-06-29');
  });

  it('resolves week context for a date in June 2026 week 4', () => {
    const context = getWeekContextForDate('2026-06-25');
    expect(context.monthKey).toBe('2026-06');
    expect(context.weekIndex).toBe(3);
  });

  it('builds secondary row preview dates Sat–Wed across week boundary', () => {
    const weekStartKey = '2026-06-22';
    const weekdayDates = getWeekdayDates(weekStartKey);
    const weekendDays = weekdayDates.slice(GOAL_HIERARCHY_PRIMARY_ROW_COUNT);
    const nextWeekStartKey = getNextWeekStartKey(weekStartKey);
    const nextWeekDates = getWeekdayDates(nextWeekStartKey);
    const previewDays = [
      ...weekendDays,
      ...nextWeekDates.slice(0, GOAL_HIERARCHY_PREVIEW_ROW_COUNT - weekendDays.length),
    ];

    expect(previewDays).toHaveLength(GOAL_HIERARCHY_PREVIEW_ROW_COUNT);
    expect(previewDays.map((d) => d.slice(8))).toEqual(['27', '28', '29', '30', '01']);
  });

  it('shifts primary row to next week Mon–Fri when week advances', () => {
    const juneWeeks = getWeeksInMonth('2026-06');
    const week4 = juneWeeks[3];
    const week5 = juneWeeks[4];
    expect(week4.weekStartKey).toBe('2026-06-22');
    expect(week5.weekStartKey).toBe('2026-06-29');

    const week4Primary = getWeekdayDates(week4.weekStartKey).slice(0, GOAL_HIERARCHY_PRIMARY_ROW_COUNT);
    const week5Primary = getWeekdayDates(week5.weekStartKey).slice(0, GOAL_HIERARCHY_PRIMARY_ROW_COUNT);

    expect(week4Primary[0]).toBe('2026-06-22');
    expect(week5Primary[0]).toBe('2026-06-29');
    expect(week4Primary).not.toEqual(week5Primary);
  });
});

describe('GoalHierarchyStorage migration', () => {
  it('expands legacy five-day weeks to seven days by dateKey', () => {
    const legacyDays = [
      { dateKey: '2026-06-22', summary: 'Mon goal', items: [] },
      { dateKey: '2026-06-23', summary: 'Tue goal', items: [] },
      { dateKey: '2026-06-24', summary: 'Wed goal', items: [] },
      { dateKey: '2026-06-25', summary: 'Thu goal', items: [] },
      { dateKey: '2026-06-26', summary: 'Fri goal', items: [] },
    ];

    const month = GoalHierarchyStorage.ensureMonth(
      { version: '1.0', months: {}, lastUpdated: '' },
      '2026-06'
    );
    const monthWithLegacy = {
      ...month,
      weeks: month.weeks.map((w) =>
        w.weekIndex === 3 ? { ...w, days: legacyDays } : w
      ),
    };
    const merged = GoalHierarchyStorage.ensureWeek(monthWithLegacy, 3);

    expect(merged.days).toHaveLength(7);
    expect(merged.days[0].summary).toBe('Mon goal');
    expect(merged.days[4].summary).toBe('Fri goal');
    expect(merged.days[5].dateKey).toBe('2026-06-27');
    expect(merged.days[5].summary).toBe('');
    expect(merged.days[6].dateKey).toBe('2026-06-28');
  });
});
