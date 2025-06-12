export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  color: string;
  description?: string;
  type: 'event';
}

export interface CalendarPeriod {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  color: string;
  description?: string;
  type: 'period';
}

export interface CalendarData {
  events: CalendarEvent[];
  periods: CalendarPeriod[];
}

export interface MonthlyEvents {
  month: number;
  year: number;
  events: CalendarEvent[];
}

export interface DayInfo {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
  periods: CalendarPeriod[];
  periodPositions: PeriodPosition[];
}

export interface PeriodPosition {
  period: CalendarPeriod;
  isStart: boolean;
  isEnd: boolean;
  isMiddle: boolean;
  row: number; // For stacking multiple periods
}

export interface CalendarProps {
  year?: number;
  data?: CalendarData;
  onEventAdd?: (event: Omit<CalendarEvent, 'id'>) => void;
  onPeriodAdd?: (period: Omit<CalendarPeriod, 'id'>) => void;
  onEventEdit?: (event: CalendarEvent) => void;
  onPeriodEdit?: (period: CalendarPeriod) => void;
  onEventDelete?: (eventId: string) => void;
  onPeriodDelete?: (periodId: string) => void;
} 