'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CalendarPeriod } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { PeriodModal } from '@/components/calendar/PeriodModal';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

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
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Create 5 years array
  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => startYear + i), [startYear]);

  // Handle ESC key for full screen
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullScreen]);

  // Process periods into segments for display
  const periodSegments = useMemo(() => {
    const segments: { 
      period: CalendarPeriod; 
      year: number; 
      startMonth: number; // 0-11
      endMonth: number;   // 0-11
      lane: number;       // 0-2 (assigned lane)
    }[] = [];

    // Filter relevant periods
    const relevantPeriods = periods.filter(p => {
      const pStartYear = new Date(p.startDate).getFullYear();
      const pEndYear = new Date(p.endDate).getFullYear();
      return pEndYear >= startYear && pStartYear < startYear + 5;
    });

    // Assign lanes for each year
    years.forEach(year => {
      // Find periods intersecting this year
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

      // Lane allocation (0, 1, 2)
      const laneOccupancy = [-1, -1, -1];

      yearPeriods.forEach(p => {
        const pStart = new Date(p.startDate);
        const pEnd = new Date(p.endDate);

        // Determine month range within this year
        let startMonth = 0;
        if (pStart.getFullYear() === year) {
          startMonth = pStart.getMonth();
        }

        let endMonth = 11;
        if (pEnd.getFullYear() === year) {
          endMonth = pEnd.getMonth();
        }

        // Find first available lane
        let assignedLane = -1;
        for (let l = 0; l < 3; l++) {
          if (laneOccupancy[l] < startMonth) {
            assignedLane = l;
            laneOccupancy[l] = endMonth;
            break;
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

  const handleAddClick = (date?: Date) => {
    setEditingPeriod(null);
    setInitialDate(date);
    setModalOpen(true);
  };

  const handleEditClick = (period: CalendarPeriod) => {
    setEditingPeriod(period);
    setInitialDate(undefined);
    setModalOpen(true);
  };

  const handleSavePeriod = (periodData: Omit<CalendarPeriod, 'id'>) => {
    if (editingPeriod) {
      onPeriodEdit(editingPeriod.id, periodData);
    } else {
      onPeriodAdd(periodData);
    }
    setModalOpen(false);
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
            <span className="font-semibold w-24 text-center text-slate-200">
              {startYear} - {startYear + 4}
            </span>
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
            onClick={() => setIsFullScreen(!isFullScreen)}
            variant="outline"
            className="border-[#334155] text-slate-300 hover:bg-[#1e293b] hover:text-white gap-2 bg-[#0f172a]"
          >
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
          </Button>

          <Button 
            onClick={() => handleAddClick()} 
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg px-6 py-2 font-semibold shadow-lg"
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
          {years.map(year => (
            <div key={year} className="grid grid-cols-[120px_repeat(12,1fr)] border-b border-[#334155] last:border-b-0">
              {/* Year Label Column */}
              <div className="flex border-r border-[#334155] bg-[#1e293b]">
                <div className="w-2/3 flex items-center justify-center text-slate-500 text-2xl font-bold border-r border-[#334155] bg-[#1e293b]">
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
                      {Array.from({ length: 12 }).map((_, monthIndex) => (
                        <div 
                          key={monthIndex} 
                          className="border-r border-[#334155] h-full last:border-r-0 hover:bg-[#334155]/30 cursor-pointer transition-colors bg-[#0f172a]"
                          onClick={() => handleAddClick(new Date(year, monthIndex, 1))}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                {/* Items */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="grid grid-cols-12 grid-rows-3 h-full w-full">
                    {periodSegments
                      .filter(seg => seg.year === year)
                      .flatMap((seg, idx) => {
                        const startMonthIndex = seg.startMonth; // 0-based
                        const duration = seg.endMonth - seg.startMonth + 1;
                        
                        // Create an array of blocks, one per month in the duration
                        return Array.from({ length: duration }).map((_, i) => {
                          const monthIndex = startMonthIndex + i;
                          const column = monthIndex + 1; // 1-based grid column
                          
                          return (
                            <div
                              key={`${seg.period.id}-${year}-${idx}-${i}`}
                              className="m-1 rounded-xl p-2 text-xs font-bold text-white shadow-lg cursor-pointer hover:brightness-110 transition-all overflow-hidden flex items-center justify-center text-center pointer-events-auto leading-snug"
                              style={{
                                gridColumnStart: column,
                                gridColumnEnd: 'span 1',
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
                        });
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
      />
    </div>
  );
}
