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

  // Current date for "now" line (recomputed each render; optional hourly refresh for midnight)
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const currentDate = useMemo(() => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const fractionWithinYear = (month + (day - 0.5) / daysInMonth) / 12;
    return {
      year,
      month,
      day,
      daysInMonth,
      fractionWithinYear,
      label: now.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    };
  }, [now]);

  const nowLineLeft = `calc(${currentDate.fractionWithinYear * 100}% - 1px)`;
  const dayFractionInMonth =
    (currentDate.day - 0.5) / currentDate.daysInMonth;

  // Check if current date is within visible range
  const isCurrentDateVisible = useMemo(() => {
    return currentDate.year >= startYear && currentDate.year < startYear + 5;
  }, [currentDate.year, startYear]);

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

  // Process periods into segments for display - one segment per month
  const periodSegments = useMemo(() => {
    const segments: { 
      period: CalendarPeriod; 
      year: number; 
      month: number; // 0-11 (single month)
      lane: number;  // 0-2 (assigned lane)
    }[] = [];

    const relevantPeriods = periods.filter(p => {
      const pStartYear = new Date(p.startDate).getFullYear();
      const pEndYear = new Date(p.endDate).getFullYear();
      return pEndYear >= startYear && pStartYear < startYear + 5;
    });

    years.forEach(year => {
      // Track lane occupancy per month for each lane
      const laneOccupancyByMonth: { [month: number]: Set<number> } = {};
      
      // Initialize occupancy tracking
      for (let m = 0; m < 12; m++) {
        laneOccupancyByMonth[m] = new Set();
      }

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

      yearPeriods.forEach(p => {
        const pStart = new Date(p.startDate);
        const pEnd = new Date(p.endDate);

        // Determine which months this period covers in this year
        let startMonth = 0;
        if (pStart.getFullYear() === year) {
          startMonth = pStart.getMonth();
        }

        let endMonth = 11;
        if (pEnd.getFullYear() === year) {
          endMonth = pEnd.getMonth();
        }

        // Assign lane for this period (try to use same lane across all months)
        let assignedLane = -1;
        
        // Try preferred lane first
        if (p.preferredLane !== undefined) {
          let canUsePreferredLane = true;
          for (let m = startMonth; m <= endMonth; m++) {
            if (laneOccupancyByMonth[m].has(p.preferredLane)) {
              canUsePreferredLane = false;
              break;
            }
          }
          if (canUsePreferredLane) {
            assignedLane = p.preferredLane;
          }
        }

        // If preferred lane not available, find first available lane
        if (assignedLane === -1) {
          for (let l = 0; l < 3; l++) {
            let canUseLane = true;
            for (let m = startMonth; m <= endMonth; m++) {
              if (laneOccupancyByMonth[m].has(l)) {
                canUseLane = false;
                break;
              }
            }
            if (canUseLane) {
              assignedLane = l;
              break;
            }
          }
        }

        // If we found a lane, create segments for each month
        if (assignedLane !== -1) {
          for (let m = startMonth; m <= endMonth; m++) {
            laneOccupancyByMonth[m].add(assignedLane);
            segments.push({
              period: p,
              year,
              month: m,
              lane: assignedLane
            });
          }
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
      "bg-background text-foreground font-sans transition-all duration-300",
      isFullScreen ? "fixed inset-0 z-50 overflow-auto p-8" : "min-h-screen p-6"
    )}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">5-Year Visualizer</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 bg-card border border-border rounded-md p-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => setStartYear(prev => prev - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Select 
              value={startYear.toString()} 
              onValueChange={(value) => setStartYear(parseInt(value))}
            >
              <SelectTrigger className="w-[180px] h-8 bg-transparent border-none text-foreground font-semibold focus:ring-0">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                  <SelectItem key={year} value={year.toString()} className="hover:bg-muted focus:bg-muted">
                    {year} - {year + 4}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => setStartYear(prev => prev + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setStartYear(new Date().getFullYear())}
            className="gap-2 h-10"
          >
            <CalendarIcon className="h-4 w-4" />
            Today
          </Button>

          <Button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            variant="outline"
            className="gap-2 h-10"
          >
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {isFullScreen ? 'Exit' : 'Full Screen'}
          </Button>

          <Button 
            onClick={() => handleAddClick()} 
            variant="default"
            className="h-10"
          >
            Add Item
          </Button>
        </div>
      </div>

      {/* Grid Container */}
      <div className={cn(
        "border border-border rounded-lg bg-card overflow-hidden shadow-2xl",
        isFullScreen ? "h-[calc(100vh-100px)]" : ""
      )}>
        <div className="min-w-[1200px] h-full overflow-auto relative">
          {/* Header Row */}
          <div className="grid grid-cols-[120px_repeat(12,1fr)] bg-card border-b border-border sticky top-0 z-20">
            <div className="p-4 font-bold text-center border-r border-border flex items-center justify-center text-xs text-muted-foreground tracking-wider uppercase">
              Year / L
            </div>
            {MONTHS.map((month, monthIndex) => {
              const isCurrentMonth = isCurrentDateVisible && monthIndex === currentDate.month;
              return (
                <div 
                  key={month} 
                  className={cn(
                    "p-4 font-bold text-center text-xs border-r border-border last:border-r-0 tracking-widest uppercase relative",
                    isCurrentMonth
                      ? "text-primary bg-primary/10 ring-2 ring-inset ring-primary"
                      : "text-foreground"
                  )}
                >
                  {month}
                  {isCurrentMonth && (
                    <div
                      className="absolute bottom-1 w-1 h-1 rounded-full bg-primary -translate-x-1/2"
                      style={{ left: `${dayFractionInMonth * 100}%` }}
                      aria-hidden
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Year Rows */}
          {years.map((year, yearIndex) => (
            <div 
              key={year} 
              className={cn(
                "grid grid-cols-[120px_repeat(12,1fr)]",
                yearIndex < years.length - 1 && "border-b-4 border-border mb-2"
              )}
            >
              {/* Year Label Column */}
              <div className="flex border-r border-border bg-card">
                <div 
                  className="w-2/3 flex items-center justify-center text-muted-foreground text-2xl font-bold border-r border-border bg-card cursor-pointer hover:text-foreground hover:bg-muted transition-colors"
                  onClick={() => setStartYear(year)}
                  title={`Set ${year} as start year`}
                >
                    {year}
                </div>
                <div className="w-1/3 flex flex-col bg-card">
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs font-medium border-b border-border">1</div>
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs font-medium border-b border-border">2</div>
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs font-medium">3</div>
                </div>
              </div>

              {/* Grid Cells - 3 Rows per year */}
              <div className="col-span-12 relative h-[216px]">
                {/* Current date: vertical line only in the row for the current calendar year */}
                {isCurrentDateVisible && year === currentDate.year && (
                  <div
                    className="absolute inset-y-0 z-10 pointer-events-none -translate-x-1/2"
                    style={{ left: nowLineLeft }}
                    title={currentDate.label}
                    aria-label={`Today: ${currentDate.label}`}
                  >
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.35)]" />
                    <div
                      className="absolute top-0 left-1/2 w-2 h-2 rounded-full bg-primary ring-2 ring-primary/30 -translate-x-1/2"
                      aria-hidden
                    />
                  </div>
                )}
                {/* Background Grid Lines & Interactive Cells */}
                <div className="absolute inset-0 grid grid-rows-3">
                  {[0, 1, 2].map((lane) => (
                    <div key={lane} className="grid grid-cols-12 h-full border-b border-border last:border-b-0">
                      {Array.from({ length: 12 }).map((_, monthIndex) => {
                        const isSelected = isCellSelected(year, monthIndex, lane);
                        const isCurrentMonth = isCurrentDateVisible && 
                                               year === currentDate.year && 
                                               monthIndex === currentDate.month;
                        return (
                          <div
                            key={monthIndex}
                            className={cn(
                                "border-r border-border h-full last:border-r-0 transition-colors cursor-pointer relative",
                                isSelected ? "bg-primary/50" : 
                                isCurrentMonth
                                  ? "bg-primary/10 ring-2 ring-inset ring-primary"
                                  :
                                "hover:bg-muted/50 bg-background"
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

                {/* Items (above the now-line so labels are not obscured) */}
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="grid grid-cols-12 grid-rows-3 h-full w-full">
                    {periodSegments
                      .filter(seg => seg.year === year)
                      .map((seg, idx) => {
                        return (
                            <div
                              key={`${seg.period.id}-${year}-${seg.month}-${seg.lane}-${idx}`}
                              className="m-1 rounded-xl p-2 text-xs font-bold text-white shadow-lg cursor-pointer hover:brightness-110 transition-all overflow-hidden flex items-center justify-center text-center pointer-events-auto leading-snug"
                              style={{
                                gridColumnStart: seg.month + 1,
                                gridColumnEnd: seg.month + 2,
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