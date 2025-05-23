import React, { useState, useEffect, useRef } from 'react';
import { Task } from '../../types/planner';
import { X, Check, Trash2, Calendar as CalendarIcon, Info, Copy, Pin, ChevronDownIcon } from 'lucide-react';
import { DURATION_OPTIONS, TASK_COLORS } from '@/lib/constants';
import { formatDuration, formatTime } from '@/utils/formatters';
import CustomTimePicker from '../primitives/CustomTimePicker';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDateWithoutTime } from '@/utils/dateUtils';

interface EditTaskModalProps {
  taskToEdit: Task & { isNew?: boolean, isFromPool?: boolean, isPinned?: boolean };
  onSave: (task: Task, options?: { isNew?: boolean, isFromPool?: boolean }) => void;
  onClose: () => void;
  onColorChange?: (taskId: string, color: string) => void;
  onDelete?: (taskId: string) => void;
  onPinTask?: (task: Task) => void;
  onMoveToPool?: (taskId: string) => void;
  pinnedTasks?: Task[];
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  taskToEdit,
  onSave,
  onClose,
  onColorChange,
  onDelete,
  onPinTask,
  onMoveToPool,
  pinnedTasks = [],
}) => {
  const [name, setName] = useState(taskToEdit.name);
  const [startHour, setStartHour] = useState(taskToEdit.startHour);
  const [duration, setDuration] = useState(taskToEdit.duration);
  const [color, setColor] = useState(taskToEdit.color || TASK_COLORS[0]);
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
    setColor(taskToEdit.color || TASK_COLORS[0]);
    setNotes(taskToEdit.notes || '');
    setSelectedDate(
      taskToEdit.baseDate ? getDateWithoutTime(taskToEdit.baseDate) : getDateWithoutTime(new Date().toISOString())
    );
    if (taskToEdit.isNew && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [taskToEdit]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (durationDropdownRef.current && !durationDropdownRef.current.contains(event.target as Node) &&
          durationControlRef.current && !durationControlRef.current.contains(event.target as Node)) {
        setIsDurationDropdownOpen(false);
      }
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        // onClose(); // Re-evaluate if closing on outside click is desired for the whole modal
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="bg-neutral-800 rounded-xl shadow-2xl p-5 w-full max-w-md border border-neutral-700 text-neutral-100 flex flex-col gap-4 relative"
      >
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-200 transition-colors z-10 p-1 rounded-full hover:bg-neutral-700"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold text-white pr-8">
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
              className="w-full p-2.5 bg-neutral-700 border border-neutral-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-white placeholder-neutral-400 text-sm"
              placeholder="Enter task name..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="taskDate" className="block text-xs font-medium text-neutral-400 mb-1">Date</label>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal p-2.5 h-auto bg-neutral-700 border-neutral-600 hover:bg-neutral-600 text-white hover:text-white",
                      !selectedDate && "text-neutral-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-80" />
                    {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-neutral-800 border-neutral-700 shadow-xl" align="start">
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
                    className="text-white [&_button]:text-white [&_button:hover]:bg-neutral-700 [&_button[aria-selected]]:bg-blue-600 [&_button[aria-selected]:hover]:bg-blue-500 [&_button[aria-selected]:focus]:bg-blue-600"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label htmlFor="taskStartTime" className="block text-xs font-medium text-neutral-400 mb-1">Start Time</label>
              <CustomTimePicker
                value={startHour}
                onChange={setStartHour}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
                <label htmlFor="taskDuration" className="block text-xs font-medium text-neutral-400 mb-1">Duration</label>
                <div ref={durationControlRef} className="relative">
                    <button
                        type="button"
                        className="w-full p-2.5 bg-neutral-700 border border-neutral-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-white placeholder-neutral-400 text-sm flex justify-between items-center h-auto"
                        onClick={() => setIsDurationDropdownOpen(!isDurationDropdownOpen)}
                    >
                        <span>{DURATION_OPTIONS.find(opt => opt.value === duration)?.label || formatDuration(duration)}</span>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDurationDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isDurationDropdownOpen && (
                        <div
                            ref={durationDropdownRef}
                            className="absolute left-0 right-0 top-full mt-1 bg-neutral-700 border border-neutral-600 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto styled-scrollbar"
                        >
                            {DURATION_OPTIONS.map((option) => (
                                <button
                                    type="button"
                                    key={option.value}
                                    className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-600 ${duration === option.value ? 'bg-blue-600 text-white' : 'text-neutral-200'}`}
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
                <div className="grid grid-cols-8 gap-1 pt-5"> {/* Increased gap for color buttons */} 
                    {TASK_COLORS.map(c => (
                        <button
                        type="button"
                        key={c}
                        className={`w-full aspect-square rounded ${c} ${color === c ? 'ring-2 ring-offset-2 ring-offset-neutral-800 ring-white' : 'hover:opacity-80'}`}
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
              className="w-full p-2.5 bg-neutral-700 border border-neutral-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-white placeholder-neutral-400 text-sm styled-scrollbar"
              placeholder="Add notes..."
            />
          </div>

          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm font-medium transition-colors"
                >
                  {taskToEdit.isNew ? 'Create Task' : 'Save Changes'}
                </button>
                {!taskToEdit.isNew && onDelete && (
                  <button
                    type="button"
                    onClick={() => { if (onDelete) onDelete(taskToEdit.id); onClose(); }}
                    className="px-3 py-2 bg-red-700 hover:bg-red-600 text-white rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" /> 
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {onPinTask && !taskToEdit.isFromPool && (
                  isTaskPinned ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs px-2 py-1 h-auto bg-neutral-700 border-neutral-600 text-sky-400 hover:bg-neutral-600 hover:text-sky-300 cursor-default"
                      disabled
                    >
                      <Pin className="w-3 h-3 mr-1.5 fill-sky-400" /> Already Pinned
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => { 
                        const taskToPin: Task = {
                          ...taskToEdit, name, startHour, duration, color, notes,
                          baseDate: getDateWithoutTime(selectedDate.toISOString()).toISOString(), dayOffset: 0
                        };
                        onPinTask(taskToPin); 
                        onClose(); 
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs px-2 py-1 h-auto bg-neutral-700 border-neutral-600 hover:bg-neutral-600 text-neutral-300 hover:text-white"
                      title="Pin this task"
                    >
                      <Pin className="w-3 h-3 mr-1.5" /> Pin Task
                    </Button>
                  )
                )}
                {onMoveToPool && !taskToEdit.isNew && !taskToEdit.isFromPool && (
                   <Button
                    type="button"
                    onClick={() => { if (onMoveToPool) onMoveToPool(taskToEdit.id); onClose(); }}
                    variant="outline"
                    size="sm"
                    className="text-xs px-2 py-1 h-auto bg-neutral-700 border-neutral-600 hover:bg-neutral-600 text-neutral-300 hover:text-white"
                    title="Move to Task Pool"
                  >
                    <Copy className="w-3 h-3 mr-1.5" /> To Pool
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
