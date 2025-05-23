import React, { useEffect, useRef } from 'react';
import { Task } from '../../types/planner';
import { Button } from "@/components/ui/button";
import { X, Edit3 } from 'lucide-react';
import { formatDuration } from '@/utils/formatters';
import { TASK_COLORS } from '@/lib/constants'; // For color indicator

interface ViewTaskNotesModalProps {
  task: Task | null;
  onClose: () => void;
  onEdit: (task: Task) => void;
}

export const ViewTaskNotesModal: React.FC<ViewTaskNotesModalProps> = ({ task, onClose, onEdit }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  if (!task) return null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleEdit = () => {
    onEdit(task);
    onClose(); // Close this modal when opening edit modal
  };
  
  const taskColorStyle = task.color || TASK_COLORS[0];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm">
      <div ref={modalRef} className="bg-neutral-800 rounded-xl shadow-2xl p-5 w-full max-w-md border border-neutral-700 text-neutral-100 flex flex-col gap-4 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-200 transition-colors z-10 p-1 rounded-full hover:bg-neutral-700"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3">
          <div className={`w-3 h-3 mt-1.5 rounded-full ${taskColorStyle} flex-shrink-0 border border-neutral-500`}></div>
          <h2 className="text-xl font-semibold text-white pr-8 flex-grow break-words">{task.name}</h2>
        </div>
        
        <div className="text-sm text-neutral-300">
          Duration: {formatDuration(task.duration)}
        </div>

        <div className="space-y-1">
          <h4 className="text-sm font-medium text-neutral-400">Notes:</h4>
          {task.notes && task.notes.trim() !== "" ? (
            <div className="text-sm text-neutral-200 bg-neutral-700/50 p-2.5 rounded-md max-h-40 overflow-y-auto styled-scrollbar whitespace-pre-wrap break-words">
              {task.notes}
            </div>
          ) : (
            <p className="text-sm text-neutral-500 italic">No notes for this task.</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-700 mt-2">
          <Button variant="outline" onClick={handleEdit} className="text-neutral-300 border-neutral-600 hover:bg-neutral-700 hover:text-neutral-100">
            <Edit3 className="w-4 h-4 mr-1.5" /> Edit Task
          </Button>
          <Button variant="default" onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}; 