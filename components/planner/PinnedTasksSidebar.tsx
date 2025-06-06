import React from 'react';
import { PinnedTask, Task } from '../../types/planner';
import { PinOff, Eye as EyeIcon, CalendarDays, Edit3, Trash2, RefreshCw } from 'lucide-react';
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

  const formatDateTimeForPinnedTask = (date: Date): string => {
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const timeStr = formatTime(date.getHours() + date.getMinutes()/60);
    return `${dateStr} at ${timeStr}`;
  };

  const hasOverdueTasks = pinnedTasks.some(task => new Date(task.dueDate).getTime() < new Date().getTime());

  return (
    <>
      <div className="flex flex-col flex-grow overflow-hidden">
        {( (onClearOverduePinnedTasks && hasOverdueTasks) || onSyncPinnedTasks ) && pinnedTasks.length > 0 && (
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
            {onClearOverduePinnedTasks && hasOverdueTasks && (
              <Button
                variant="outline"
                size="sm"
                className="flex-auto text-muted-foreground border-gray-200 dark:border-gray-700 hover:bg-accent hover:text-foreground"
                onClick={onClearOverduePinnedTasks}
                title="Clear all overdue pinned tasks"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear Overdue
              </Button>
            )}
            {onSyncPinnedTasks && (
              <Button
                variant="outline"
                size="icon"
                className="text-muted-foreground border-gray-200 dark:border-gray-700 hover:bg-accent hover:text-foreground flex-none"
                onClick={onSyncPinnedTasks}
                title="Sync Pinned Tasks with Timeline"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
        <div className="p-2 space-y-2 overflow-y-auto flex-grow">
          {pinnedTasks.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center pt-4">No tasks pinned yet.</p> 
          ) : (
            pinnedTasks.map(pinnedTask => {
              const { text: timeRemainingText, isOverdue } = formatTimeRemaining(new Date(pinnedTask.dueDate));
              const dueDateObj = new Date(pinnedTask.dueDate);

              return (
                <div 
                  key={pinnedTask.pinnedId} 
                  className="relative p-3 rounded-lg bg-card border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-150 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate pr-20">
                        {pinnedTask.name}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <div className="flex items-center space-x-2">
                          <CalendarDays className="w-3 h-3" />
                          <span>{formatDateTimeForPinnedTask(dueDateObj)}</span>
                        </div>
                        <span 
                          className={`${
                            isOverdue 
                              ? 'text-red-500' 
                              : 'text-blue-500'
                          }`}
                        >
                          {timeRemainingText}
                        </span>
                      </div>
                    </div>
                    
                    <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        className="h-6 w-6 rounded-md bg-accent hover:bg-accent/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
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
                        className="h-6 w-6 rounded-md bg-accent hover:bg-accent/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingPinnedTaskNotes(pinnedTask);
                        }}
                        title="View Notes"
                      >
                        <EyeIcon className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        className="h-6 w-6 rounded-md bg-accent hover:bg-accent/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => onUnpinTask(pinnedTask.pinnedId)}
                        title="Unpin task"
                      >
                        <PinOff className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
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