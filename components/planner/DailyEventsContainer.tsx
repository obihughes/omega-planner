import React from 'react';
import { CalendarEvent, CalendarPeriod } from '@/types/calendar';
import { Calendar, Clock, Eye, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DailyEventsContainerProps {
  events: CalendarEvent[];
  periods: CalendarPeriod[];
  currentDate: Date;
  eventsOnly?: boolean; // New prop to show only events
  onEventEdit?: (event: CalendarEvent) => void;
  onPeriodEdit?: (period: CalendarPeriod) => void;
  onEventView?: (event: CalendarEvent) => void;
  onPeriodView?: (period: CalendarPeriod) => void;
}

export const DailyEventsContainer: React.FC<DailyEventsContainerProps> = ({
  events,
  periods,
  currentDate,
  eventsOnly = false,
  onEventEdit,
  onPeriodEdit,
  onEventView,
  onPeriodView,
}) => {
  // Filter events for the current date
  const todaysEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return (
      eventDate.getDate() === currentDate.getDate() &&
      eventDate.getMonth() === currentDate.getMonth() &&
      eventDate.getFullYear() === currentDate.getFullYear()
    );
  });

  // Filter periods that include the current date (only if not eventsOnly)
  const todaysPeriods = eventsOnly ? [] : periods.filter(period => {
    const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const startDateOnly = new Date(period.startDate.getFullYear(), period.startDate.getMonth(), period.startDate.getDate());
    const endDateOnly = new Date(period.endDate.getFullYear(), period.endDate.getMonth(), period.endDate.getDate());
    return currentDateOnly >= startDateOnly && currentDateOnly <= endDateOnly;
  });

  // If no events or periods for today, don't render anything
  if (todaysEvents.length === 0 && todaysPeriods.length === 0) {
    return null;
  }

  const formatEventTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const formatPeriodDates = (startDate: Date, endDate: Date) => {
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="mb-4 bg-card border border-border shadow-sm rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">
            {eventsOnly ? "Today's Events" : "Today's Events & Periods"}
          </h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {todaysEvents.length + todaysPeriods.length}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {currentDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex flex-wrap gap-2">
          {/* Events */}
          {todaysEvents.map((event) => (
            <div
              key={event.id}
              className="group flex items-center gap-2 p-2 bg-background border border-border rounded-md hover:border-accent hover:bg-accent/10 transition-all duration-200 min-w-0 flex-shrink-0"
            >
              {/* Event indicator */}
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: event.color }}
              />
              
              {/* Event content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm text-foreground truncate">
                    {event.title}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatEventTime(event.date)}</span>
                  </div>
                </div>
                {event.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {event.description}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEventView && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onEventView(event)}
                    title="View Event"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                )}
                {onEventEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onEventEdit(event)}
                    title="Edit Event"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Periods */}
          {todaysPeriods.map((period) => (
            <div
              key={period.id}
              className="group flex items-center gap-2 p-2 bg-background border border-border rounded-md hover:border-accent hover:bg-accent/10 transition-all duration-200 min-w-0 flex-shrink-0"
            >
              {/* Period indicator */}
              <div 
                className="w-6 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: period.color }}
              />
              
              {/* Period content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm text-foreground truncate">
                    {period.title}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{formatPeriodDates(period.startDate, period.endDate)}</span>
                  </div>
                </div>
                {period.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {period.description}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onPeriodView && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onPeriodView(period)}
                    title="View Period"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                )}
                {onPeriodEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onPeriodEdit(period)}
                    title="Edit Period"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
