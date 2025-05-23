import React from 'react';
import { PinnedTask } from '../../types/planner';
import { PinOff, Eye as EyeIcon } from 'lucide-react';

interface PinnedTasksSidebarProps {
  pinnedTasks: PinnedTask[];
  onUnpinTask: (pinnedId: string) => void;
  formatTimeRemaining: (dueDate: Date) => { text: string; isOverdue: boolean };
  // activeTab: 'pool' | 'pinned'; // May not be needed if parent controls rendering
  openEditModal: (task: PinnedTask, options?: { isNew?: boolean, isFromPool?: boolean, isPinned?: boolean }) => void; // For viewing/editing
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

  return (
    <>
      <div className="flex flex-col flex-grow overflow-hidden">
        <div className="p-2 space-y-1.5 overflow-y-auto flex-grow">
          {pinnedTasks.length === 0 ? (
            <p className="text-slate-400 text-sm text-center pt-4">No tasks pinned yet.</p> 
          ) : (
            pinnedTasks.map(pinnedTask => {
              const { text: timeRemainingText, isOverdue } = formatTimeRemaining(new Date(pinnedTask.dueDate));
              const cardBg = pinnedTask.color || 'bg-slate-700';
              const overdueClasses = isOverdue ? 'opacity-70 saturate-50' : 'opacity-90';

              return (
                <div 
                  key={pinnedTask.pinnedId} 
                  className={`relative p-2 rounded-md shadow ${cardBg} ${overdueClasses} transition-all duration-150 group`}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-sm text-white truncate pr-10 flex-grow">
                      {pinnedTask.name}
                    </p>
                    <div className="absolute top-1.5 right-1.5 flex items-center space-x-1">
                      <button
                        type="button"
                        className="h-5 w-5 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 hover:text-white transition-colors"
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
                        className="h-5 w-5 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 hover:text-white transition-colors"
                        onClick={() => onUnpinTask(pinnedTask.pinnedId)}
                        title="Unpin task"
                      >
                        <PinOff className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className={`text-xs mt-1 text-right font-bold ${isOverdue ? 'text-red-400' : 'text-slate-300'}`}>
                    {timeRemainingText}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {viewingPinnedTaskNotes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1002] p-4">
          <div 
            ref={viewModalRef}
            className="relative bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-4 w-full max-w-md space-y-3 text-white"
            onDoubleClick={() => setViewingPinnedTaskNotes(null)}
          >
            <button 
              type="button"
              onClick={() => setViewingPinnedTaskNotes(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 transition-colors z-10"
              aria-label="Close notes view"
            >
              <PinOff className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold pr-8 line-clamp-3">
              {viewingPinnedTaskNotes.name}
            </h3>

            {viewingPinnedTaskNotes.notes && viewingPinnedTaskNotes.notes.trim() !== "" ? (
              <div className="text-sm text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto border-t border-gray-700 pt-2 mt-2">
                {viewingPinnedTaskNotes.notes}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic mt-2 pt-2 border-t border-gray-700">
                No notes for this task.
              </p>
            )}
            <div className="flex justify-end items-center pt-3 border-t border-gray-700 mt-3">
                <button 
                  className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
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