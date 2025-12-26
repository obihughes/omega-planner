'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CalendarPeriod } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { PeriodModal } from '@/components/calendar/PeriodModal';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Calendar as CalendarIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FiveYearVisualizerProps {
  periods: CalendarPeriod[];
  onPeriodAdd: (period: Omit<CalendarPeriod, 'id'>) => void;
  onPeriodEdit: (id: string, period: Partial<CalendarPeriod>) => void;
  onPeriodDelete: (periodId: string) => void;
}

const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

export function FiveYearVisualizer({
  periods,
  onPeriodAdd,
  onPeriodEdit,
  onPeriodDelete
}: FiveYearVisualizerProps) {
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<CalendarPeriod | null>(null);
  const [initialDate, setInitialDate] = useState<Date | undefined>(undefined);
  const [initialEndDate, setInitialEndDate] = useState<Date | undefined>(undefined);
  const [preferredLane, setPreferredLane] = useState<number | undefined>(undefined);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Drag selection state
  const [dragStart, setDragStart] = useState<{ year: number; month: number; lane: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ year: number; month: number; lane: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Create 5 years array
  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => startYear + i), [startYear]);

  // Handle Drag Start
  const handleDragStart = (year: number, month: number, lane: number) => {
    setDragStart({ year, month, lane });
    setDragEnd({ year, month, lane });
    setIsDragging(true);
  };

  // Handle Drag Enter (while dragging)
  const handleDragEnter = (year: number, month: number, lane: number) => {
    if (isDragging && dragStart) {
        // We only update if it's different to avoid excessive renders, though React handles this well
        setDragEnd({ year, month, lane });
    }
  };

  // Handle Drag End (commit)
  const handleDragEnd = () => {
    if (!dragStart || !dragEnd) return;

    let startYear = dragStart.year;
    let startMonth = dragStart.month;
    let endYear = dragEnd.year;
    let endMonth = dragEnd.month;

    // Ensure start is before end
    if (startYear > endYear || (startYear === endYear && startMonth > endMonth)) {
        [startYear, endYear] = [endYear, startYear];
        [startMonth, endMonth] = [endMonth, startMonth];
    }

    const startDate = new Date(startYear, startMonth, 1);
    const endDate = new Date(endYear, endMonth + 1, 0); // Last day of end month

    setInitialDate(startDate);
    setInitialEndDate(endDate);
    setEditingPeriod(null);
    setPreferredLane(dragStart.lane);
    setModalOpen(true);
    
    // Reset drag state
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // Handle Global Mouse Up and ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    window.addEventListener('keydown', handleEsc);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
        window.removeEventListener('keydown', handleEsc);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isFullScreen, isDragging, dragStart, dragEnd]); // Include dependencies for closure

  // Process periods into segments for display
  const periodSegments = useMemo(() => {
    const segments: { 
      period: CalendarPeriod; 
      year: number; 
      startMonth: number; // 0-11
      endMonth: number;   // 0-11
      lane: number;       // 0-2 (assigned lane)
    }[] = [];

    const relevantPeriods = periods.filter(p => {
      const pStartYear = new Date(p.startDate).getFullYear();
      const pEndYear = new Date(p.endDate).getFullYear();
      return pEndYear >= startYear && pStartYear < startYear + 5;
    });

    years.forEach(year => {
      const yearPeriods = relevantPeriods.filter(p => {
        const pStartYear = new Date(p.startDate).getFullYear();
        const pEndYear = new Date(p.endDate).getFullYear();
        return pStartYear <= year && pEndYear >= year;
      });

      // Sort by start date, then duration
      yearPeriods.sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return (new Date(b.endDate).getTime() - dateB) - (new Date(a.endDate).getTime() - dateA);
      });

      const laneOccupancy = [-1, -1, -1];

      yearPeriods.forEach(p => {
        const pStart = new Date(p.startDate);
        const pEnd = new Date(p.endDate);

        let startMonth = 0;
        if (pStart.getFullYear() === year) {
          startMonth = pStart.getMonth();
        }

        let endMonth = 11;
        if (pEnd.getFullYear() === year) {
          endMonth = pEnd.getMonth();
        }

        let assignedLane = -1;
        if (p.preferredLane !== undefined && laneOccupancy[p.preferredLane] < startMonth) {
          assignedLane = p.preferredLane;
          laneOccupancy[assignedLane] = endMonth;
        } else {
          for (let l = 0; l < 3; l++) {
            if (laneOccupancy[l] < startMonth) {
              assignedLane = l;
              laneOccupancy[l] = endMonth;
              break;
            }
          }
        }

        if (assignedLane !== -1) {
          segments.push({
            period: p,
            year,
            startMonth,
            endMonth,
            lane: assignedLane
          });
        }
      });
    });

    return segments;
  }, [periods, years, startYear]);

  // Only used for single click if not dragging
  const handleAddClick = (date?: Date, lane?: number) => {
    setEditingPeriod(null);
    setInitialDate(date);
    setInitialEndDate(undefined);
    setPreferredLane(lane);
    setModalOpen(true);
  };

  const handleEditClick = (period: CalendarPeriod) => {
    setEditingPeriod(period);
    setInitialDate(undefined);
    setInitialEndDate(undefined);
    setModalOpen(true);
  };

  const handleSavePeriod = (periodData: Omit<CalendarPeriod, 'id'>) => {
    if (editingPeriod && editingPeriod.id) {
      onPeriodEdit(editingPeriod.id, periodData);
    } else {
      const periodWithLane = { ...periodData, preferredLane };
      onPeriodAdd(periodWithLane as any);
    }
    setModalOpen(false);
    setPreferredLane(undefined);
    setEditingPeriod(null);
  };

  // Helper to check if a cell is selected during drag
  const isCellSelected = (year: number, month: number, lane: number) => {
      if (!isDragging || !dragStart || !dragEnd) return false;
      if (lane !== dragStart.lane) return false; // Only highlight same lane
      
      let startY = dragStart.year;
      let startM = dragStart.month;
      let endY = dragEnd.year;
      let endM = dragEnd.month;
      
      if (startY > endY || (startY === endY && startM > endM)) {
        [startY, endY] = [endY, startY];
        [startM, endM] = [endM, startM];
      }
      
      // Check if current cell is within range
      if (year < startY || year > endY) return false;
      if (year === startY && month < startM) return false;
      if (year === endY && month > endM) return false;
      
      return true;
  };

  return (
    <div className={cn(
      "bg-[#0f172a] text-slate-200 font-sans transition-all duration-300",
      isFullScreen ? "fixed inset-0 z-50 overflow-auto p-8" : "min-h-screen p-6"
    )}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">5-Year Visualizer</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 bg-[#1e293b] border border-[#334155] rounded-md p-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-[#334155]"
              onClick={() => setStartYear(prev => prev - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Select 
              value={startYear.toString()} 
              onValueChange={(value) => setStartYear(parseInt(value))}
            >
              <SelectTrigger className="w-[180px] h-8 bg-transparent border-none text-slate-200 font-semibold focus:ring-0">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent className="bg-[#1e293b] border-[#334155] text-slate-200">
                {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                  <SelectItem key={year} value={year.toString()} className="hover:bg-[#334155] focus:bg-[#334155]">
                    {year} - {year + 4}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-[#334155]"
              onClick={() => setStartYear(prev => prev + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setStartYear(new Date().getFullYear())}
            className="border-[#334155] text-slate-300 hover:bg-[#1e293b] hover:text-white gap-2 bg-[#0f172a] h-10"
          >
            <CalendarIcon className="h-4 w-4" />
            Today
          </Button>

          <Button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            variant="outline"
            className="border-[#334155] text-slate-300 hover:bg-[#1e293b] hover:text-white gap-2 bg-[#0f172a] h-10"
          >
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {isFullScreen ? 'Exit' : 'Full Screen'}
          </Button>

          <Button 
            onClick={() => handleAddClick()} 
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg px-6 py-2 font-semibold shadow-lg h-10"
          >
            Add Item
          </Button>
        </div>
      </div>

      {/* Grid Container */}
      <div className={cn(
        "border border-[#334155] rounded-lg bg-[#1e293b] overflow-hidden shadow-2xl",
        isFullScreen ? "h-[calc(100vh-100px)]" : ""
      )}>
        <div className="min-w-[1200px] h-full overflow-auto">
          {/* Header Row */}
          <div className="grid grid-cols-[120px_repeat(12,1fr)] bg-[#1e293b] border-b border-[#334155] sticky top-0 z-20">
            <div className="p-4 font-bold text-center border-r border-[#334155] flex items-center justify-center text-xs text-slate-400 tracking-wider uppercase">
              Year / L
            </div>
            {MONTHS.map(month => (
              <div key={month} className="p-4 font-bold text-center text-xs border-r border-[#334155] last:border-r-0 text-white tracking-widest uppercase">
                {month}
              </div>
            ))}
          </div>

          {/* Year Rows */}
          {years.map((year, yearIndex) => (
            <div 
              key={year} 
              className={cn(
                "grid grid-cols-[120px_repeat(12,1fr)]",
                yearIndex < years.length - 1 && "border-b-4 border-[#475569] mb-2"
              )}
            >
              {/* Year Label Column */}
              <div className="flex border-r border-[#334155] bg-[#1e293b]">
                <div 
                  className="w-2/3 flex items-center justify-center text-slate-500 text-2xl font-bold border-r border-[#334155] bg-[#1e293b] cursor-pointer hover:text-white hover:bg-[#334155] transition-colors"
                  onClick={() => setStartYear(year)}
                  title={`Set ${year} as start year`}
                >
                    {year}
                </div>
                <div className="w-1/3 flex flex-col bg-[#1e293b]">
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-medium border-b border-[#334155]">1</div>
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-medium border-b border-[#334155]">2</div>
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-medium">3</div>
                </div>
              </div>

              {/* Grid Cells - 3 Rows per year */}
              <div className="col-span-12 relative h-[216px]">
                {/* Background Grid Lines & Interactive Cells */}
                <div className="absolute inset-0 grid grid-rows-3">
                  {[0, 1, 2].map((lane) => (
                    <div key={lane} className="grid grid-cols-12 h-full border-b border-[#334155] last:border-b-0">
                      {Array.from({ length: 12 }).map((_, monthIndex) => {
                        const isSelected = isCellSelected(year, monthIndex, lane);
                        return (
                          <div
                            key={monthIndex}
                            className={cn(
                                "border-r border-[#334155] h-full last:border-r-0 transition-colors cursor-pointer",
                                isSelected ? "bg-[#2563EB]/50" : "hover:bg-[#334155]/30 bg-[#0f172a]"
                            )}
                            onMouseDown={(e) => {
                                e.preventDefault(); // Prevent text selection
                                handleDragStart(year, monthIndex, lane);
                            }}
                            onMouseEnter={() => handleDragEnter(year, monthIndex, lane)}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Items */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="grid grid-cols-12 grid-rows-3 h-full w-full">
                    {periodSegments
                      .filter(seg => seg.year === year)
                      .map((seg, idx) => {
                        return (
                            <div
                              key={`${seg.period.id}-${year}-${idx}`}
                              className="m-1 rounded-xl p-2 text-xs font-bold text-white shadow-lg cursor-pointer hover:brightness-110 transition-all overflow-hidden flex items-center justify-center text-center pointer-events-auto leading-snug"
                              style={{
                                gridColumnStart: seg.startMonth + 1,
                                gridColumnEnd: seg.endMonth + 2,
                                gridRowStart: seg.lane + 1,
                                backgroundColor: seg.period.color,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(seg.period);
                              }}
                            >
                               <span className="line-clamp-3 break-normal hyphens-none w-full">{seg.period.title}</span>
                            </div>
                          );
                      })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PeriodModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSave={handleSavePeriod}
        onDelete={onPeriodDelete}
        period={editingPeriod}
        initialDate={initialDate}
        initialEndDate={initialEndDate}
      />
    </div>
  );
}