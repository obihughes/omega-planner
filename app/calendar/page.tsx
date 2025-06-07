'use client';

import React, { useState, useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Navigation } from '@/components/ui/Navigation';
import { Project } from '@/types';
import { Calendar, ChevronLeft, ChevronRight, Clock, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CalendarPage() {
  const { projects, loading } = useProjects();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get the first day of the current month and calculate calendar grid
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay()); // Start on Sunday

  const daysInCalendar = [];
  for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    daysInCalendar.push(date);
  }

  // Group projects by due date
  const projectsByDate = useMemo(() => {
    const grouped: { [key: string]: Project[] } = {};
    
    projects
      .filter(project => !project.isDeleted && project.endDate)
      .forEach(project => {
        const dueDate = new Date(project.endDate!);
        const dateKey = dueDate.toDateString();
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(project);
      });
    
    return grouped;
  }, [projects]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getProjectsForDate = (date: Date) => {
    return projectsByDate[date.toDateString()] || [];
  };

  const formatTimeRemaining = (dueDate: string): { text: string; isOverdue: boolean } => {
    const now = new Date();
    const due = new Date(dueDate);
    due.setHours(23, 59, 59, 999);

    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < -1) return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
    if (diffDays === -1) return { text: `1d overdue`, isOverdue: true };
    if (diffDays === 0) return { text: 'Due today', isOverdue: false };
    if (diffDays === 1) return { text: 'Due tomorrow', isOverdue: false };
    return { text: `${diffDays}d left`, isOverdue: false };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading calendar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Calendar className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Project Calendar</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-semibold text-foreground min-w-[200px] text-center">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-card border rounded-lg overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-4 text-center font-medium text-muted-foreground bg-muted">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {daysInCalendar.map((date, index) => {
              const dayProjects = getProjectsForDate(date);
              const isCurrentMonthDay = isCurrentMonth(date);
              const isTodayDate = isToday(date);
              
              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[120px] p-2 border-r border-b border-border last:border-r-0",
                    !isCurrentMonthDay && "bg-muted/30",
                    isTodayDate && "bg-primary/10"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-2",
                    !isCurrentMonthDay && "text-muted-foreground",
                    isTodayDate && "text-primary font-bold"
                  )}>
                    {date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {dayProjects.slice(0, 3).map(project => {
                      const timeRemaining = formatTimeRemaining(project.endDate!);
                      return (
                        <div
                          key={project.id}
                          className="p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: project.color + '20', borderLeft: `3px solid ${project.color}` }}
                          title={`${project.name} - ${timeRemaining.text}`}
                        >
                          <div className="flex items-center space-x-1">
                            <Folder className="w-3 h-3 flex-shrink-0" style={{ color: project.color }} />
                            <span className="truncate font-medium">{project.name}</span>
                          </div>
                          <div className={cn(
                            "flex items-center space-x-1 mt-0.5",
                            timeRemaining.isOverdue ? "text-red-600" : "text-muted-foreground"
                          )}>
                            <Clock className="w-2.5 h-2.5" />
                            <span>{timeRemaining.text}</span>
                          </div>
                        </div>
                      );
                    })}
                    {dayProjects.length > 3 && (
                      <div className="text-xs text-muted-foreground p-1">
                        +{dayProjects.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-semibold text-foreground mb-2">This Month</h3>
            <p className="text-2xl font-bold text-primary">
              {Object.entries(projectsByDate).reduce((count, [dateString, projects]) => {
                const date = new Date(dateString);
                return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear() 
                  ? count + projects.length 
                  : count;
              }, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Projects due</p>
          </div>
          
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-semibold text-foreground mb-2">Overdue</h3>
            <p className="text-2xl font-bold text-red-600">
              {Object.entries(projectsByDate).reduce((count, [dateString, projects]) => {
                const date = new Date(dateString);
                const isOverdue = date < new Date(new Date().setHours(0, 0, 0, 0));
                return isOverdue ? count + projects.length : count;
              }, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Projects overdue</p>
          </div>
          
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-semibold text-foreground mb-2">Next 7 Days</h3>
            <p className="text-2xl font-bold text-orange-600">
              {Object.entries(projectsByDate).reduce((count, [dateString, projects]) => {
                const date = new Date(dateString);
                const today = new Date();
                const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                return date >= today && date <= nextWeek ? count + projects.length : count;
              }, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Projects due soon</p>
          </div>
        </div>
      </div>
    </div>
  );
} 