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
    <div className={cn("space-y-1", className)}>
      {dayEvents.slice(0, 3).map((event) => ( // Limit to 3 events to avoid overflow
        <div
          key={event.id}
          className="flex items-center gap-1 p-1 bg-background/80 border border-border/50 rounded text-xs hover:bg-accent/20 transition-colors"
          title={`${event.title}${event.description ? ` - ${event.description}` : ''}`}
        >
          {/* Event indicator */}
          <div 
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: event.color }}
          />
          
          {/* Event content */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground truncate leading-tight">
              {event.title}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-2 h-2" />
              <span className="text-[10px]">{formatEventTime(event.date)}</span>
            </div>
          </div>
        </div>
      ))}
      
      {/* Show overflow indicator if there are more than 3 events */}
      {dayEvents.length > 3 && (
        <div className="text-[10px] text-muted-foreground text-center p-1 bg-muted/30 rounded">
          +{dayEvents.length - 3} more
        </div>
      )}
    </div>
  );
};
