import React from 'react';
import { PinnedTask, Task } from '../../types/planner';
import { PinOff, Eye as EyeIcon, CalendarDays, Edit3 } from 'lucide-react';
import { formatTime } from '@/utils/formatters';

interface PinnedTasksSidebarProps {
  pinnedTasks: PinnedTask[];
  onUnpinTask: (pinnedId: string) => void;
  formatTimeRemaining: (dueDate: Date) => { text: string; isOverdue: boolean };
  openEditModal: (task: Task, options?: { isNew?: boolean, isFromPool?: boolean, isPinned?: boolean }) => void;
  // activeTab: 'pool' | 'pinned'; // May not be needed if parent controls rendering
  // openEditModal: (task: PinnedTask, options?: { isNew?: boolean, isFromPool?: boolean, isPinned?: boolean }) => void; // For viewing/editing
}

export const PinnedTasksSidebar: React.FC<PinnedTasksSidebarProps> = ({
  pinnedTasks,
  onUnpinTask,
  formatTimeRemaining,
  openEditModal, 
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

  const formatDateForPinnedTask = (date: Date): string => {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div className="flex flex-col flex-grow overflow-hidden">
        <div className="p-2 space-y-2 overflow-y-auto flex-grow">
          {pinnedTasks.length === 0 ? (
            <p className="text-slate-400 text-sm text-center pt-4">No tasks pinned yet.</p> 
          ) : (
            pinnedTasks.map(pinnedTask => {
              const { text: timeRemainingText, isOverdue } = formatTimeRemaining(new Date(pinnedTask.dueDate));
              const cardBg = pinnedTask.color || 'bg-slate-700';
              const overdueClasses = isOverdue ? 'opacity-60 saturate-50 filter grayscale-[20%]' : 'opacity-90';
              const dueDateObj = new Date(pinnedTask.dueDate);

              return (
                <div 
                  key={pinnedTask.pinnedId} 
                  className={`relative p-2.5 rounded-lg shadow-md ${cardBg} ${overdueClasses} transition-all duration-150 group border border-slate-600/50`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-base text-white truncate pr-24 flex-grow min-w-0">
                        {pinnedTask.name}
                      </p>
                      <div className="absolute top-2 right-2 flex items-center space-x-1.5">
                        <button
                          type="button"
                          className="h-6 w-6 rounded-md bg-black/20 hover:bg-black/30 flex items-center justify-center text-slate-200 hover:text-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(pinnedTask as Task, { isPinned: true });
                          }}
                          title="Edit Task"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          className="h-6 w-6 rounded-md bg-black/20 hover:bg-black/30 flex items-center justify-center text-slate-200 hover:text-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingPinnedTaskNotes(pinnedTask);
                          }}
                          title="View Notes"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          className="h-6 w-6 rounded-md bg-black/20 hover:bg-black/30 flex items-center justify-center text-slate-200 hover:text-white transition-colors"
                          onClick={() => onUnpinTask(pinnedTask.pinnedId)}
                          title="Unpin task"
                        >
                          <PinOff className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center text-xs text-slate-300">
                        <CalendarDays className="w-3 h-3 mr-1.5 opacity-70" />
                        <span>{formatDateForPinnedTask(dueDateObj)}</span>
                        <span className="mx-1.5">•</span>
                        <span>{formatTime(dueDateObj.getHours() + dueDateObj.getMinutes()/60)}</span>
                    </div>

                    <div className={`text-sm font-bold text-right ${isOverdue ? 'text-red-400' : 'text-sky-300'} pt-1`}>
                      {timeRemainingText}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {viewingPinnedTaskNotes && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1002] p-4 backdrop-blur-sm">
          <div 
            ref={viewModalRef}
            className="relative bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-5 w-full max-w-lg space-y-4 text-slate-100"
            onDoubleClick={() => setViewingPinnedTaskNotes(null)}
          >
            <button 
              type="button"
              onClick={() => setViewingPinnedTaskNotes(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-200 transition-colors z-10 p-1 rounded-full hover:bg-slate-700"
              aria-label="Close notes view"
            >
              <PinOff className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-semibold pr-8 line-clamp-3">
              {viewingPinnedTaskNotes.name}
            </h3>

            {(viewingPinnedTaskNotes.notes && viewingPinnedTaskNotes.notes.trim() !== "") ? (
              <div className="text-sm text-slate-300 whitespace-pre-wrap max-h-72 overflow-y-auto border-t border-slate-700 pt-3 mt-3 styled-scrollbar">
                {viewingPinnedTaskNotes.notes}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic mt-3 pt-3 border-t border-slate-700">
                No notes for this task.
              </p>
            )}
            <div className="flex justify-end items-center pt-4 border-t border-slate-700 mt-4">
                <button 
                  className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors font-medium"
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