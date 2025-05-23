import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react'; // Example icons
import { formatTime } from '@/utils/formatters'; // Assuming formatTime is in formatters

/**
 * Props for the CustomTimePicker component.
 */
interface CustomTimePickerProps {
  /** The current time value, represented as a decimal number (e.g., 9.5 for 9:30 AM). */
  value: number;
  /** Callback function invoked when the time value changes. */
  onChange: (value: number) => void;
  /** Optional ID for the component. */
  id?: string;
  /** Optional CSS class name for the component. */
  className?: string;
  minHour?: number; // e.g., TIMELINE_START_HOUR
  maxHour?: number; // e.g., TIMELINE_END_HOUR - MIN_TASK_DURATION
}

const formatTimeToDisplay = (hour24: number): string => {
  const h = Math.floor(hour24);
  const m = (hour24 % 1) * 60;
  const period = h < 12 || h === 24 ? 'AM' : 'PM'; // 24 is 12 AM next day, handle if necessary based on maxHour
  let displayHour = h % 12;
  if (displayHour === 0) displayHour = 12; // 0 or 12 should be 12
  return `${displayHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
};

/**
 * A custom time picker component that allows users to select a time.
 * It displays the time and provides a popover with controls to adjust hours, minutes, and AM/PM.
 * The time is represented internally as a decimal number (e.g., 9.5 for 9:30 AM).
 */
const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  value,
  onChange,
  id,
  className,
  minHour = 0, 
  maxHour = 23.75, // 11:45 PM as a default
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLButtonElement>(null);

  // Convert current value to H, M, Period for easier manipulation in popover
  const currentHour24 = Math.floor(value);
  const currentMinute = Math.round((value % 1) * 60); // Ensure minute is rounded for comparison
  const currentPeriodIsAM = currentHour24 < 12 || currentHour24 === 24; // Assuming 24 is 12 AM

  const [selectedHour12, setSelectedHour12] = useState(() => {
    let h = currentHour24 % 12;
    if (h === 0) h = 12;
    return h;
  });
  const [selectedMinute, setSelectedMinute] = useState(currentMinute);
  const [selectedPeriodAM, setSelectedPeriodAM] = useState(currentPeriodIsAM);

  // Update internal picker state if the external value changes
  useEffect(() => {
    const h24 = Math.floor(value);
    const m = Math.round((value % 1) * 60); // Ensure minute is rounded
    const pAM = h24 < 12 || h24 === 24;
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;

    setSelectedHour12(h12);
    setSelectedMinute(m);
    setSelectedPeriodAM(pAM);
  }, [value]);
  
  const convertTo24HourValue = (h12: number, min: number, isAM: boolean): number => {
    let h24 = h12;
    if (isAM && h12 === 12) h24 = 0; // 12 AM is 0 hour
    else if (!isAM && h12 !== 12) h24 = h12 + 12; // PM hours (except 12 PM)
    else if (!isAM && h12 === 12) h24 = 12; // 12 PM is 12 hour
    return parseFloat((h24 + min / 60).toFixed(2));
  };

  const handleTimeChange = (newH12?: number, newMin?: number, newIsAM?: boolean) => {
    let h12 = newH12 !== undefined ? newH12 : selectedHour12;
    let min = newMin !== undefined ? newMin : selectedMinute;
    const isAM = newIsAM !== undefined ? newIsAM : selectedPeriodAM;
    
    // Hour wrapping for +/- buttons and scroll
    if (newH12 !== undefined) { // only wrap if hour was explicitly changed
        if (h12 > 12) h12 = 1;
        if (h12 < 1) h12 = 12;
    }
    // Minute wrapping for +/- buttons and scroll
    if (newMin !== undefined) { // only wrap if minute was explicitly changed
        if (min >= 60) min = 0;
        if (min < 0) min = 45;
    }
    
    let new24Val = convertTo24HourValue(h12, min, isAM);
    
    // Clamp value within min/max range
    new24Val = Math.max(minHour, Math.min(maxHour, new24Val));

    // Update state for picker and call onChange
    const finalH24 = Math.floor(new24Val);
    const finalM = Math.round((new24Val % 1) * 60); // Round final minute as well
    const finalPAM = finalH24 < 12 || finalH24 === 24;
    let finalH12 = finalH24 % 12;
    if (finalH12 === 0) finalH12 = 12;

    setSelectedHour12(finalH12);
    setSelectedMinute(finalM);
    setSelectedPeriodAM(finalPAM);
    onChange(new24Val);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
          displayRef.current && !displayRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleHourWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const delta = event.deltaY < 0 ? 1 : -1;
    handleTimeChange(selectedHour12 + delta, undefined, undefined);
  };

  const handleMinuteWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const delta = event.deltaY < 0 ? 15 : -15;
    handleTimeChange(undefined, selectedMinute + delta, undefined);
  };

  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const minuteOptions = [0, 15, 30, 45];

  return (
    <div className="relative w-full">
      <button
        ref={displayRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-sm text-left border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white flex justify-between items-center"
      >
        <span>{formatTimeToDisplay(value)}</span>
        <Clock className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div 
          ref={popoverRef} 
          className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg p-2"
          style={{ top: '100%' }} // Position below the button
        >
          <div className="flex items-center justify-around space-x-1">
            {/* Hour Picker */}
            <div className="flex flex-col items-center">
              <button onClick={() => handleTimeChange(selectedHour12 + 1)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><ChevronUp size={16}/></button>
              <span 
                className="text-lg font-semibold w-8 text-center tabular-nums cursor-ns-resize py-1"
                onWheel={handleHourWheel}
              >
                {selectedHour12.toString().padStart(2, '0')}
              </span>
              <button onClick={() => handleTimeChange(selectedHour12 - 1)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><ChevronDown size={16}/></button>
            </div>
            <span className="text-lg font-semibold">:</span>
            {/* Minute Picker */}
            <div className="flex flex-col items-center">
              <button onClick={() => handleTimeChange(undefined, selectedMinute + 15)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><ChevronUp size={16}/></button>
              <span 
                className="text-lg font-semibold w-8 text-center tabular-nums cursor-ns-resize py-1"
                onWheel={handleMinuteWheel}
              >
                {selectedMinute.toString().padStart(2, '0')}
              </span>
              <button onClick={() => handleTimeChange(undefined, selectedMinute - 15)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><ChevronDown size={16}/></button>
            </div>
            {/* AM/PM Picker */}
            <div className="flex flex-col items-center space-y-1">
              <button 
                onClick={() => handleTimeChange(undefined, undefined, true)} 
                className={`px-2 py-1 text-xs rounded ${selectedPeriodAM ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
              >
                AM
              </button>
              <button 
                onClick={() => handleTimeChange(undefined, undefined, false)} 
                className={`px-2 py-1 text-xs rounded ${!selectedPeriodAM ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
              >
                PM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomTimePicker; 