import React, { useState, useEffect, useRef } from 'react';
import { PinnedTask, Task } from '../../types/planner';
import { PinOff, Eye as EyeIcon, CalendarDays, Edit3, Trash2, RefreshCw, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { formatTime } from '@/utils/formatters';
import { Button, Input } from "@/components/ui";

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
  const [searchTerm, setSearchTerm] = useState('');

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
    // Handle "Due now" case
    if (timeRemaining === "Due now") {
      return "Now";
    }
    
    // Handle complex patterns first (e.g., "Due in 2 days 3 hrs")
    const dayHourMatch = timeRemaining.match(/(\d+)\s+day\w*\s+(\d+)\s+hr/);
    if (dayHourMatch) {
      const days = dayHourMatch[1];
      const hours = dayHourMatch[2];
      return `${days}d ${hours}h`;
    }
    
    // Handle hour + minute patterns (e.g., "Due in 5 hrs 30 mins")
    const hourMinMatch = timeRemaining.match(/(\d+)\s+hr\w*\s+(\d+)\s+min/);
    if (hourMinMatch) {
      const hours = hourMinMatch[1];
      const minutes = hourMinMatch[2];
      return `${hours}h ${minutes}m`;
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
    
    // Handle single time units - order matters! Check larger units first
    if (timeRemaining.includes('day')) {
      const days = timeRemaining.match(/(\d+)\s+day/)?.[1];
      return `${days}d`;
    }
    if (timeRemaining.includes('hr')) {
      const hrs = timeRemaining.match(/(\d+)\s+hr/)?.[1];
      // Convert large hour values to days
      const hourNum = parseInt(hrs || '0');
      if (hourNum >= 24) {
        const days = Math.floor(hourNum / 24);
        const remainingHours = hourNum % 24;
        return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
      }
      return `${hrs}h`;
    }
    if (timeRemaining.includes('min')) {
      const mins = timeRemaining.match(/(\d+)\s+min/)?.[1];
      return `${mins}m`;
    }
    
    // Return as-is for edge cases
    return timeRemaining;
  };

  const hasOverdueTasks = pinnedTasks.some(task => {
    const taskDueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
    return taskDueDate.getTime() < new Date().getTime();
  });

  const filteredPinnedTasks = pinnedTasks.filter(task => 
    task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.notes && task.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <div className="flex flex-col flex-grow overflow-hidden">
        {/* Search Input */}
        <div className="px-2 pt-2 pb-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search pinned tasks..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-input border border-border rounded-md focus:ring-1 focus:ring-ring focus:border-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

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
          {filteredPinnedTasks.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4 w-full">No pinned tasks found.</p>
          ) : (
            filteredPinnedTasks
              .sort((a, b) => {
                // Sort by due date, then by name
                const dateA = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate);
                const dateB = b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate);
                if (dateA.getTime() !== dateB.getTime()) {
                  return dateA.getTime() - dateB.getTime();
                }
                return a.name.localeCompare(b.name);
              })
              .map(task => {
                const timeRemaining = formatTimeRemaining(task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate));
                const isOverdue = timeRemaining.isOverdue;

                return (
                  <div
                    key={task.pinnedId}
                    className={`relative p-2 rounded-lg bg-card/60 backdrop-blur-sm border border-border/50 hover:shadow-md transition-all duration-150 group flex-shrink-0 w-48 h-16 ${isOverdue ? 'bg-red-500/10 border-red-500/20' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 h-full">
                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate leading-tight mb-1">
                          {task.name || "Untitled Pinned Task"}
                        </p>
                        <div className={`text-xs ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                          <div className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3 flex-shrink-0" />
                            <span>{formatCompactTimeRemaining(timeRemaining.text)}</span>
                          </div>
                        </div>
                      </div>
                    
                    {/* Action buttons - stacked vertically */}
                    <div className="absolute top-0.5 right-0.5 flex flex-col gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        className="h-5 w-5 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingPinnedTaskNotes(task);
                        }}
                        title="View Notes"
                      >
                        <EyeIcon className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        className="h-5 w-5 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(task as Task, { isPinned: true });
                        }}
                        title="Edit Task"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        className="h-5 w-5 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnpinTask(task.pinnedId);
                        }}
                        title="Unpin task"
                      >
                        <PinOff className="w-2.5 h-2.5" />
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
            {/* Close button in top-right corner */}
            <button 
              type="button"
              onClick={() => setViewingPinnedTaskNotes(null)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors z-10 p-1 rounded-full hover:bg-accent"
              aria-label="Close notes view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Task title */}
            <h3 className="text-xl font-semibold line-clamp-3 text-foreground">
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
            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                <button 
                  type="button"
                  onClick={() => {
                    onUnpinTask(viewingPinnedTaskNotes.pinnedId);
                    setViewingPinnedTaskNotes(null);
                  }}
                  className="px-4 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <PinOff className="w-4 h-4" />
                  Unpin
                </button>
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