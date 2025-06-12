import React, { useState, useEffect, useRef } from 'react';
import { Task } from '../../types/planner';
import { X, Check, Trash2, Calendar as CalendarIcon, Info, Copy, Pin, ChevronDownIcon } from 'lucide-react';
import { DURATION_OPTIONS, TASK_COLORS, DEFAULT_TASK_COLOR_INDEX } from '@/lib/constants';
import { formatDuration, formatTime } from '@/utils/formatters';
import { CustomTimePicker } from '@/components/primitives';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "../../lib/utils";
import { getDateWithoutTime } from '@/utils/dateUtils';

/**
 * Props for the EditTaskModal component.
 */
interface EditTaskModalProps {
  /** The task object to be edited or the template for a new task. 
   *  `isNew` indicates if the task is being created.
   *  `isFromPool` indicates if the task originated from the task pool.
   *  `isPinned` indicates if the task is currently pinned (though this prop seems unused directly for pin status display).
  */
  taskToEdit: Task & { isNew?: boolean, isFromPool?: boolean, isPinned?: boolean };
  /** Callback function to save the task. */
  onSave: (task: Task, options?: { isNew?: boolean, isFromPool?: boolean }) => void;
  /** Callback function to close the modal. */
  onClose: () => void;
  /** Optional callback for when the task color is changed (currently not directly used by a color picker in this modal but could be for future use or direct prop passing). */
  onColorChange?: (taskId: string, color: string) => void;
  /** Optional callback to delete the task. If provided, a delete button is shown for existing tasks. */
  onDelete?: (taskId: string, isFromPool?: boolean) => void;
  /** Optional callback to pin the task. If provided, a pin button is shown. */
  onPinTask?: (task: Task) => void;
  /** Optional callback to move the task to the task pool. If provided, a "To Pool" button is shown for existing, non-pool tasks. */
  onMoveToPool?: (taskId: string) => void;
  /** Optional array of currently pinned tasks, used to determine if the task being edited is already pinned. Defaults to an empty array. */
  pinnedTasks?: Task[];
  /** Optional callback to copy the current task's data, close the modal, and enter paste mode. */
  onCopyAndEnterPasteMode?: (taskData: Omit<Task, 'id'>) => void; 
}

/**
 * A modal component for creating new tasks or editing existing ones.
 * It includes fields for task name, date, start time, duration, color, and notes.
 * Provides options to save, delete, pin, or move tasks to a pool.
 */
export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  taskToEdit,
  onSave,
  onClose,
  onColorChange,
  onDelete,
  onPinTask,
  onMoveToPool,
  pinnedTasks = [],
  onCopyAndEnterPasteMode,
}) => {
  const [name, setName] = useState(taskToEdit.name);
  const [startHour, setStartHour] = useState(taskToEdit.startHour);
  const [duration, setDuration] = useState(taskToEdit.duration);
  const [color, setColor] = useState(taskToEdit.color || TASK_COLORS[DEFAULT_TASK_COLOR_INDEX]);
  const [notes, setNotes] = useState(taskToEdit.notes || '');
  const [selectedDate, setSelectedDate] = useState<Date>(
    taskToEdit.baseDate ? getDateWithoutTime(taskToEdit.baseDate) : getDateWithoutTime(new Date().toISOString())
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false); // Added this state

  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const durationControlRef = useRef<HTMLDivElement>(null); // Added this ref
  const durationDropdownRef = useRef<HTMLDivElement>(null); // Added this ref

  useEffect(() => {
    setName(taskToEdit.name);
    setStartHour(taskToEdit.startHour);
    setDuration(taskToEdit.duration);
    setColor(taskToEdit.color || TASK_COLORS[DEFAULT_TASK_COLOR_INDEX]);
    setNotes(taskToEdit.notes || '');
    setSelectedDate(
      taskToEdit.baseDate ? getDateWithoutTime(taskToEdit.baseDate) : getDateWithoutTime(new Date().toISOString())
    );
    if (taskToEdit.isNew && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [taskToEdit]);

  // This effect is purely for the duration dropdown.
  useEffect(() => {
    const handleClickOutsideDuration = (event: MouseEvent) => {
      if (durationDropdownRef.current && !durationDropdownRef.current.contains(event.target as Node) &&
          durationControlRef.current && !durationControlRef.current.contains(event.target as Node)) {
        setIsDurationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideDuration);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideDuration);
    };
  }, []); // Corrected dependency array to empty as it only affects internal state of dropdown

  // New useEffect for Modal Close on Escape and Click Outside
  useEffect(() => {
    const handleClickOutsideModal = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutsideModal);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideModal);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedBaseDate = new Date(selectedDate);
    normalizedBaseDate.setHours(0,0,0,0); 
    
    const finalTask: Task = {
      ...taskToEdit,
      name,
      startHour,
      duration,
      color,
      notes,
      baseDate: normalizedBaseDate.toISOString(),
      dayOffset: 0 
    };
    onSave(finalTask, { isNew: taskToEdit.isNew, isFromPool: taskToEdit.isFromPool });
    onClose();
  };

  const isTaskPinned = pinnedTasks.some(pt => pt.id === taskToEdit.id || (pt as any).originalId === taskToEdit.id);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div 
        ref={modalRef}
        className="bg-card rounded-xl shadow-2xl p-5 w-full max-w-md border border-border text-foreground flex flex-col gap-4 relative"
      >
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors z-10 p-1 rounded-full hover:bg-accent"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold text-foreground pr-8">
          {taskToEdit.isNew ? 'Create New Task' : 'Edit Task'}
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <input
              id="taskName"
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-input border border-border rounded-md focus:ring-1 focus:ring-ring focus:border-ring outline-none text-foreground placeholder-muted-foreground text-sm"
              placeholder="Enter task name..."
              required
            />
          </div>

          {/* Date, Time, Duration, Color Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-4">
            <div>
              <label htmlFor="taskDate" className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal p-2.5 h-auto",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-80" />
                    {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setIsDatePickerOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <label htmlFor="taskStartTime" className="block text-xs font-medium text-muted-foreground mb-1">Start Time</label>
              <CustomTimePicker
                value={startHour}
                onChange={setStartHour}
              />
            </div>

            <div>
                <label htmlFor="taskDuration" className="block text-xs font-medium text-muted-foreground mb-1">Duration</label>
                <div ref={durationControlRef} className="relative">
                    <button
                        type="button"
                        className="w-full p-2.5 bg-input border border-border rounded-md focus:ring-1 focus:ring-ring focus:border-ring outline-none text-foreground text-sm flex justify-between items-center h-auto"
                        onClick={() => setIsDurationDropdownOpen(!isDurationDropdownOpen)}
                    >
                        <span>{DURATION_OPTIONS.find(opt => opt.value === duration)?.label || formatDuration(duration)}</span>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDurationDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isDurationDropdownOpen && (
                        <div
                            ref={durationDropdownRef}
                            className="absolute left-0 right-0 top-full mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto styled-scrollbar"
                        >
                            {DURATION_OPTIONS.map((option) => (
                                <button
                                    type="button"
                                    key={option.value}
                                    className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-accent ${duration === option.value ? 'bg-primary text-primary-foreground' : 'text-popover-foreground'}`}
                                    onClick={() => { setDuration(option.value); setIsDurationDropdownOpen(false); }}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div>
                {/* <label className="block text-xs font-medium text-neutral-400 mb-1">Color</label> */}
                {/* Adjusting top padding for alignment in the new grid structure */}
                <div className="grid grid-cols-6 gap-1 pt-1 md:pt-[26px]"> {/* pt-1 for mobile, pt-[26px] for md+ to align with label+input above */}
                    {TASK_COLORS.map(c => (
                        <button
                        type="button"
                        key={c}
                        className={`w-full aspect-square rounded ${c} ${color === c ? 'ring-2 ring-offset-2 ring-offset-card ring-foreground' : 'hover:opacity-80'}`}
                        onClick={() => setColor(c)}
                        />
                    ))}
                </div>
            </div>
          </div>
          
          <div>
            {/* <label htmlFor="taskNotes" className="block text-sm font-medium text-neutral-300 mb-1">Notes</label> */}
            <textarea
              id="taskNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full p-2.5 bg-input border border-border rounded-md focus:ring-1 focus:ring-ring focus:border-ring outline-none text-foreground placeholder-muted-foreground text-sm styled-scrollbar"
              placeholder="Add notes..."
            />
          </div>

          {/* Modal Footer with Action Buttons - Revised Layout */}
          <div className="flex flex-col gap-3 pt-4 border-t border-border mt-4">
            {/* Action buttons row */}
            <div className="flex items-center gap-2 flex-wrap">
              {!taskToEdit.isNew && onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { onDelete(taskToEdit.id, taskToEdit.isFromPool); onClose(); }}
                  className="px-3 py-1.5 text-xs text-red-500 border-red-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              )}
              {onCopyAndEnterPasteMode && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const { isNew, isFromPool, ...taskDataForCopy } = taskToEdit;
                    onCopyAndEnterPasteMode({
                      name,
                      startHour,
                      duration,
                      color,
                      notes,
                      baseDate: selectedDate.toISOString(),
                      dayOffset: 0,
                      completed: taskDataForCopy.completed,
                    });
                  }}
                  className="px-3 py-1.5 text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" /> Copy
                </Button>
              )}
              {onPinTask && !taskToEdit.isFromPool && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const taskToPin = { 
                      ...taskToEdit, 
                      name, startHour, duration, color, notes, 
                      baseDate: selectedDate.toISOString(), dayOffset: 0 
                    };
                    onPinTask(taskToPin);
                  }}
                  disabled={isTaskPinned}
                  className={`px-3 py-1.5 text-xs ${isTaskPinned ? 'text-primary' : ''}`}
                >
                  <Pin className="w-3 h-3 mr-1" /> {isTaskPinned ? 'Pinned' : 'Pin'}
                </Button>
              )}
              {!taskToEdit.isFromPool && onMoveToPool && !taskToEdit.isNew && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { if (onMoveToPool) { onMoveToPool(taskToEdit.id); onClose();} }}
                  className="px-3 py-1.5 text-xs"
                >
                  To Pool
                </Button>
              )}
            </div>

            {/* Save button row - full width */}
            <Button 
              type="submit" 
              className="w-full py-2 text-sm font-medium"
            >
              <Check className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
