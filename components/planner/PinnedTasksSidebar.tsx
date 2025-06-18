import React from 'react';
import { PinnedTask, Task } from '../../types/planner';
import { PinOff, Eye as EyeIcon, CalendarDays, Edit3, Trash2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatTime } from '@/utils/formatters';
import { Button } from "@/components/ui";

interface PinnedTasksSidebarProps {
  pinnedTasks: PinnedTask[];
  onUnpinTask: (pinnedId: string) => void;
  formatTimeRemaining: (dueDate: Date) => { text: string; isOverdue: boolean };
  openEditModal: (task: Task, options?: { isNew?: boolean, isFromPool?: boolean, isPinned?: boolean }) => void;
  /** Optional callback to clear all overdue pinned tasks. */
  onClearOverduePinnedTasks?: () => void;
  /** Optional callback to sync pinned tasks with the timeline. */
  onSyncPinnedTasks?: () => void;
  // activeTab: 'pool' | 'pinned'; // May not be needed if parent controls rendering
  // openEditModal: (task: PinnedTask, options?: { isNew?: boolean, isFromPool?: boolean, isPinned?: boolean }) => void; // For viewing/editing
}

export const PinnedTasksSidebar: React.FC<PinnedTasksSidebarProps> = ({
  pinnedTasks,
  onUnpinTask,
  formatTimeRemaining,
  openEditModal, 
  onClearOverduePinnedTasks,
  onSyncPinnedTasks,
}) => {
  const [viewingPinnedTaskNotes, setViewingPinnedTaskNotes] = React.useState<PinnedTask | null>(null);
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const viewModalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (viewModalRef.current && !viewModalRef.current.contains(event.target as Node)) {
        setViewingPinnedTaskNotes(null);
      }
    };
    if (viewingPinnedTaskNotes) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [viewingPinnedTaskNotes]);

  // Scroll navigation functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const cardWidth = 204; // w-48 (192px) + gap (12px)
      scrollContainerRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const cardWidth = 204; // w-48 (192px) + gap (12px)
      scrollContainerRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setScrollPosition(scrollLeft);
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  React.useEffect(() => {
    const updateScrollButtons = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5); // 5px buffer
      }
    };
    
    updateScrollButtons();
    const resizeObserver = new ResizeObserver(updateScrollButtons);
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [pinnedTasks.length]);

  const formatDateTimeForPinnedTask = (date: Date): string => {
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const timeStr = formatTime(date.getHours() + date.getMinutes()/60);
    return `${dateStr} at ${timeStr}`;
  };

  const formatCompactTimeRemaining = (timeRemaining: string): string => {
    // Handle complex patterns first (e.g., "Due in 2 days 3 hrs")
    const dayHourMatch = timeRemaining.match(/(\d+)\s+day\w*\s+(\d+)\s+hr/);
    if (dayHourMatch) {
      const days = dayHourMatch[1];
      const hours = dayHourMatch[2];
      return `${days}d ${hours}h`;
    }
    
    // Handle overdue patterns
    if (timeRemaining.includes('Overdue by')) {
      if (timeRemaining.includes('day')) {
        const days = timeRemaining.match(/(\d+)\s+day/)?.[1];
        return `${days}d overdue`;
      } else if (timeRemaining.includes('hr')) {
        const hrs = timeRemaining.match(/(\d+)\s+hr/)?.[1];
        return `${hrs}h overdue`;
      } else if (timeRemaining.includes('min')) {
        const mins = timeRemaining.match(/(\d+)\s+min/)?.[1];
        return `${mins}m overdue`;
      }
    }
    
    // Handle single time units
    if (timeRemaining.includes('min')) {
      const mins = timeRemaining.match(/(\d+)/)?.[1];
      return `${mins}m`;
    }
    if (timeRemaining.includes('hr')) {
      const hrs = timeRemaining.match(/(\d+)/)?.[1];
      // Convert large hour values to days
      const hourNum = parseInt(hrs || '0');
      if (hourNum >= 24) {
        const days = Math.floor(hourNum / 24);
        const remainingHours = hourNum % 24;
        return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
      }
      return `${hrs}h`;
    }
    if (timeRemaining.includes('day')) {
      const days = timeRemaining.match(/(\d+)/)?.[1];
      return `${days}d`;
    }
    
    // Return as-is for edge cases
    return timeRemaining;
  };

  const hasOverdueTasks = pinnedTasks.some(task => new Date(task.dueDate).getTime() < new Date().getTime());

  return (
    <>
      <div className="flex flex-col flex-grow overflow-hidden">
        {/* Navigation arrows */}
        {pinnedTasks.length > 0 && (
          <div className="absolute top-1/2 -translate-y-1/2 left-1 right-1 flex justify-between pointer-events-none z-10">
            <button
              type="button"
              className={`pointer-events-auto h-6 w-6 rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-sm hover:bg-background transition-all duration-200 flex items-center justify-center ${
                canScrollLeft ? 'opacity-100' : 'opacity-30 cursor-not-allowed'
              }`}
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              title="Scroll left"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              className={`pointer-events-auto h-6 w-6 rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-sm hover:bg-background transition-all duration-200 flex items-center justify-center ${
                canScrollRight ? 'opacity-100' : 'opacity-30 cursor-not-allowed'
              }`}
              onClick={scrollRight}
              disabled={!canScrollRight}
              title="Scroll right"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        <div 
          ref={scrollContainerRef}
          className="p-2 flex space-x-3 overflow-x-auto overflow-y-hidden flex-grow scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
          onScroll={handleScroll}
        >
          {pinnedTasks.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center pt-4 w-full">No tasks pinned yet.</p> 
          ) : (
            pinnedTasks.map(pinnedTask => {
              const { text: timeRemainingText, isOverdue } = formatTimeRemaining(new Date(pinnedTask.dueDate));
              const dueDateObj = new Date(pinnedTask.dueDate);

              return (
                <div 
                  key={pinnedTask.pinnedId} 
                  className="relative p-3 rounded-lg bg-card border border-border/50 hover:shadow-md transition-all duration-150 group flex-shrink-0 w-48 h-24"
                >
                  <div className="flex items-start justify-between gap-3 h-full">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Color status dot */}
                      <div 
                        className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                          isOverdue ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                      />
                      
                      <div className="flex-1 min-w-0">
                        {/* Task name */}
                        <p className="font-medium text-sm text-foreground truncate leading-tight mb-2">
                          {pinnedTask.name}
                        </p>
                        
                        {/* Due date */}
                        <div className="flex items-center gap-1 mb-1">
                          <CalendarDays className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground truncate">{formatDateTimeForPinnedTask(dueDateObj)}</span>
                        </div>
                        
                        {/* Time remaining */}
                        <div className="text-xs">
                          <span 
                            className={`font-medium ${
                              isOverdue ? 'text-red-500' : 'text-blue-500'
                            }`}
                          >
                            {formatCompactTimeRemaining(timeRemainingText)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        className="h-6 w-6 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnpinTask(pinnedTask.pinnedId);
                        }}
                        title="Unpin task"
                      >
                        <PinOff className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        className="h-6 w-6 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(pinnedTask as Task, { isPinned: true });
                        }}
                        title="Edit Task"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        className="h-6 w-6 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingPinnedTaskNotes(pinnedTask);
                        }}
                        title="View Notes"
                      >
                        <EyeIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Scroll indicator dots */}
        {pinnedTasks.length > 2 && (
          <div className="flex justify-center py-1 space-x-1">
            {Array.from({ length: Math.ceil(pinnedTasks.length / 2) }, (_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  Math.floor(scrollPosition / 204) === i ? 'bg-foreground' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {viewingPinnedTaskNotes && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[1002] p-4">
          <div 
            ref={viewModalRef}
            className="relative bg-card rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-lg space-y-4"
            onDoubleClick={() => setViewingPinnedTaskNotes(null)}
          >
            <button 
              type="button"
              onClick={() => setViewingPinnedTaskNotes(null)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors z-10 p-1 rounded-full hover:bg-accent"
              aria-label="Close notes view"
            >
              <PinOff className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-semibold pr-8 line-clamp-3 text-foreground">
              {viewingPinnedTaskNotes.name}
            </h3>

            {(viewingPinnedTaskNotes.notes && viewingPinnedTaskNotes.notes.trim() !== "") ? (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-72 overflow-y-auto border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                {viewingPinnedTaskNotes.notes}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                No notes for this task.
              </p>
            )}
            <div className="flex justify-end items-center pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                <button 
                  className="px-4 py-2 text-sm bg-accent hover:bg-accent/80 rounded-lg transition-colors font-medium text-foreground"
                  onClick={() => setViewingPinnedTaskNotes(null)}
                >
                  Close
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 