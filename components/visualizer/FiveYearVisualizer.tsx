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

  const handleAddClick = () => {
    setEditingPeriod(null);
    setModalOpen(true);
  };

  const handleEditClick = (period: CalendarPeriod) => {
    setEditingPeriod(period);
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
          <Button onClick={handleAddClick} className="bg-primary hover:bg-primary/90">
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
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 -rotate-90 origin-center whitespace-nowrap text-lg text-foreground/80 font-bold w-20 text-center">
                    {year}
                  </span>
                  2
                </div>
                <div className="flex-1 w-full flex items-center justify-center text-xs text-muted-foreground/50 h-1/3">3</div>
              </div>

              {/* Grid Cells Background - 3 Rows per year */}
              <div className="col-span-12 grid grid-rows-3 relative h-[150px]">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="border-r border-border/20 h-full last:border-r-0" />
                  ))}
                </div>
                <div className="absolute inset-0 grid grid-rows-3 pointer-events-none">
                   <div className="border-b border-border/20 w-full" />
                   <div className="border-b border-border/20 w-full" />
                </div>

                {/* Items */}
                {periodSegments
                  .filter(seg => seg.year === year)
                  .map((seg, idx) => {
                    const startCol = seg.startMonth + 2; // +1 for 1-based grid, +1 for year column? No, we are in a col-span-12 div.
                    // Wait, the container is col-span-12. So gridColumnStart 1 is Jan.
                    const startColumn = seg.startMonth + 1;
                    const span = seg.endMonth - seg.startMonth + 1;
                    
                    return (
                      <div
                        key={`${seg.period.id}-${year}-${idx}`}
                        className="m-1 rounded-md p-2 text-xs font-medium text-white shadow-sm cursor-pointer hover:brightness-110 transition-all overflow-hidden whitespace-normal leading-tight flex items-center justify-center text-center"
                        style={{
                          gridColumnStart: startColumn,
                          gridColumnEnd: `span ${span}`,
                          gridRowStart: seg.lane + 1,
                          backgroundColor: seg.period.color || '#3b82f6',
                        }}
                        onClick={() => handleEditClick(seg.period)}
                      >
                         {seg.period.title}
                      </div>
                    );
                  })}
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
      />
    </div>
  );
}
