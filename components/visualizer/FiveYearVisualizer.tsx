'use client';

import React, { useState, useMemo } from 'react';
import { CalendarPeriod } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { PeriodModal } from '@/components/calendar/PeriodModal';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  
  // Create 5 years array
  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => startYear + i), [startYear]);

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
    <div className="h-full flex flex-col bg-background text-foreground p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">5-Year Visualizer</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 bg-card border rounded-md p-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setStartYear(prev => prev - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold w-24 text-center">
              {startYear} - {startYear + 4}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setStartYear(prev => prev + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => handleAddClick()} className="bg-primary hover:bg-primary/90">
            Add Item
          </Button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-auto border rounded-lg bg-card/50">
        <div className="min-w-[1000px]">
          {/* Header Row */}
          <div className="grid grid-cols-[100px_repeat(12,1fr)] bg-card border-b">
            <div className="p-3 font-semibold text-center border-r flex items-center justify-center text-sm text-muted-foreground">
              Year / L
            </div>
            {MONTHS.map(month => (
              <div key={month} className="p-3 font-semibold text-center text-sm border-r last:border-r-0 text-muted-foreground">
                {month}
              </div>
            ))}
          </div>

          {/* Year Rows */}
          {years.map(year => (
            <div key={year} className="grid grid-cols-[100px_repeat(12,1fr)] border-b last:border-b-0 relative">
              {/* Year Label Column */}
              <div className="border-r bg-card/30 flex flex-col justify-center items-center font-bold text-xl text-muted-foreground">
                <div className="flex-1 w-full flex items-center justify-center border-b border-border/10 text-xs text-muted-foreground/50 h-1/3">1</div>
                <div className="flex-1 w-full flex items-center justify-center border-b border-border/10 text-xs text-muted-foreground/50 h-1/3 relative">
                  <span className="text-lg text-foreground/80 font-bold">
                    {year}
                  </span>
                </div>
                <div className="flex-1 w-full flex items-center justify-center text-xs text-muted-foreground/50 h-1/3">3</div>
              </div>

              {/* Grid Cells Background - 3 Rows per year */}
              <div className="col-span-12 grid grid-rows-3 relative h-[180px]">
                {/* Background Grid Lines & Interactive Cells */}
                <div className="absolute inset-0 grid grid-rows-3">
                  {[0, 1, 2].map((lane) => (
                    <div key={lane} className="grid grid-cols-12 h-full border-b border-border/20 last:border-b-0">
                      {Array.from({ length: 12 }).map((_, monthIndex) => (
                        <div 
                          key={monthIndex} 
                          className="border-r border-border/20 h-full last:border-r-0 hover:bg-muted/30 cursor-pointer transition-colors"
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
                              className="m-1 rounded-lg p-2 text-xs font-medium text-white shadow-sm cursor-pointer hover:brightness-110 transition-all overflow-hidden whitespace-normal leading-snug flex items-center justify-center text-center pointer-events-auto"
                              style={{
                                gridColumnStart: column,
                                gridColumnEnd: 'span 1',
                                gridRowStart: seg.lane + 1,
                                backgroundColor: seg.period.color || '#3b82f6',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(seg.period);
                              }}
                            >
                               <span className="line-clamp-3 break-words w-full">{seg.period.title}</span>
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
