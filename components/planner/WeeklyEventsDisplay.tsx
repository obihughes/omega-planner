import React from 'react';
import { CalendarEvent } from '@/types/calendar';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeeklyEventsDisplayProps {
  events: CalendarEvent[];
  date: Date;
  className?: string;
}

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

  // If no events for this day, don't render anything
  if (dayEvents.length === 0) {
    return null;
  }

  const formatEventTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  return (
    <div className={cn("w-full h-full overflow-hidden", className)}>
      {dayEvents.slice(0, 2).map((event, index) => ( // Limit to 2 events for timeline column
        <div
          key={event.id}
          className="mb-1 last:mb-0 p-1 bg-card/90 border border-border/50 rounded text-xs hover:bg-accent/40 transition-colors backdrop-blur-sm"
          title={`${event.title}${event.description ? ` - ${event.description}` : ''}`}
        >
          {/* Event indicator and title */}
          <div className="flex items-center gap-1 mb-0.5">
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: event.color }}
            />
            <div className="font-medium text-foreground leading-tight text-[10px] truncate">
              {event.title}
            </div>
          </div>
          
          {/* Event time */}
          <div className="flex items-center gap-1 text-muted-foreground pl-3">
            <Clock className="w-2 h-2 flex-shrink-0" />
            <span className="text-[9px] leading-none">{formatEventTime(event.date)}</span>
          </div>
        </div>
      ))}
      
      {/* Show overflow indicator if there are more than 2 events */}
      {dayEvents.length > 2 && (
        <div className="text-[9px] text-muted-foreground text-center py-0.5 px-1 bg-muted/50 rounded font-medium">
          +{dayEvents.length - 2}
        </div>
      )}
    </div>
  );
};
