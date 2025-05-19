import React from 'react';
import { PinnedTask } from '../../types/planner';
import { PinOff } from 'lucide-react';

interface PinnedTasksSidebarProps {
  pinnedTasks: PinnedTask[];
  onUnpinTask: (pinnedId: string) => void;
  formatTimeRemaining: (dueDate: Date) => string;
  // activeTab: 'pool' | 'pinned'; // May not be needed if parent controls rendering
}

export const PinnedTasksSidebar: React.FC<PinnedTasksSidebarProps> = ({
  pinnedTasks,
  onUnpinTask,
  formatTimeRemaining,
  // activeTab,
}) => {

  // if (activeTab !== 'pinned') {
  //   return null;
  // }

  return (
    <div className="flex flex-col flex-grow overflow-hidden">
      {/* Pinned Tasks List Area */}
      <div className="p-3 space-y-2 overflow-y-auto flex-grow">
        {pinnedTasks.length === 0 ? (
          <p className="text-slate-400 text-sm text-center pt-2">No tasks pinned yet.</p> 
        ) : (
          pinnedTasks.map(pinnedTask => (
            <div key={pinnedTask.pinnedId} className={`relative px-1.5 py-1 rounded-md text-xs ${pinnedTask.color || 'bg-slate-800'}`}>
              <p className="font-medium text-white truncate pr-5">{pinnedTask.name}</p>
              {/* Ensure dueDate is a Date object before passing to formatTimeRemaining */}
              <p className="text-[10px] text-slate-300">{formatTimeRemaining(new Date(pinnedTask.dueDate))}</p>
              <button
                type="button"
                className="absolute top-1 right-1 h-5 w-5 rounded bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                onClick={() => onUnpinTask(pinnedTask.pinnedId)}
                title="Unpin task"
              >
                <PinOff className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 