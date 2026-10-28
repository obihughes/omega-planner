import React from 'react';
import { CalendarEvent } from '@/types/calendar';
import { Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeeklyEventsDisplayProps {
  events: CalendarEvent[];
  date: Date;
  className?: string;
}

/**
 * Read-only preview of a day's calendar events and primary weekly goals.
 * Click handling is provided by the parent (WeeklyDayGoalsPopover wraps this component),
 * so the whole cell, including the "+N more" overflow, opens the day's goals popover.
 */
export const WeeklyEventsDisplay: React.FC<WeeklyEventsDisplayProps> = ({
  events,
  date,
  className
}) => {
  // Filter events for the specific date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return (
      eventDate.getDate() === date.getDate() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getFullYear() === date.getFullYear()
    );
  });

  const formatEventTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  // Always render the container so the whole cell stays clickable, even on empty days
  if (dayEvents.length === 0) {
    return (
      <div className={cn("w-full h-full flex items-center justify-center", className)}>
        <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity select-none">
          + goals
        </span>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full overflow-hidden", className)}>
      {dayEvents.slice(0, 3).map((event) =>
        event.source === 'primary-goal' ? (
          // Primary weekly goals are all-day, so they show no clock time
          <div
            key={event.id}
            className="mb-1 last:mb-0 px-1.5 py-1 rounded-md border-2 text-xs shadow-sm flex items-center gap-1.5"
            style={{ borderColor: event.color, backgroundColor: `${event.color}22` }}
            title={`Primary goal: ${event.title}${event.description ? ` - ${event.description}` : ''}`}
          >
            <Star className="w-2.5 h-2.5 flex-shrink-0 fill-current" style={{ color: event.color }} />
            <div className="font-semibold text-foreground leading-tight text-[11px] truncate">
              {event.title}
            </div>
          </div>
        ) : (
          <div
            key={event.id}
            className="mb-1 last:mb-0 p-1.5 bg-card border border-border/50 rounded-md text-xs hover:bg-accent/30 transition-colors shadow-sm"
            title={`${event.title}${event.description ? ` - ${event.description}` : ''}`}
          >
            {/* Event indicator and title */}
            <div className="flex items-center gap-1.5 mb-1">
              <div 
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: event.color }}
              />
              <div className="font-medium text-foreground leading-tight text-[11px] truncate">
                {event.title}
              </div>
            </div>

            {/* Event time */}
            <div className="flex items-center gap-1 text-muted-foreground pl-4">
              <Clock className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="text-[10px] leading-none">{formatEventTime(event.date)}</span>
            </div>
          </div>
        )
      )}

      {/* Show overflow indicator if there are more than 3 events */}
      {dayEvents.length > 3 && (
        <div className="text-[10px] text-muted-foreground text-center py-1 px-2 bg-muted/40 rounded font-medium">
          +{dayEvents.length - 3} more
        </div>
      )}
    </div>
  );
};
