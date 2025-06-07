'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';
import { Navigation } from '@/components/ui/Navigation';
import { Project, ProjectTask } from '@/types';
import { Calendar, ChevronLeft, ChevronRight, Clock, Folder, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CalendarPage() {
  const { projects, loading } = useProjects();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get the first day of the current month and calculate calendar grid
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Calculate the start date (first Sunday of the calendar grid)
  const startDate = new Date(firstDayOfMonth);
  const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
  startDate.setDate(firstDayOfMonth.getDate() - firstDayWeekday);

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

  // Group completed tasks by completion date and project
  const taskCompletionsByDate = useMemo(() => {
    const grouped: { [key: string]: { project: Project; tasks: ProjectTask[] }[] } = {};
    
    projects
      .filter(project => !project.isDeleted)
      .forEach(project => {
        const completedTasks = project.tasks.filter(task => 
          task.status === 'completed' && task.completedAt
        );
        
        completedTasks.forEach(task => {
          const completedDate = new Date(task.completedAt!);
          const dateKey = completedDate.toDateString();
          
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          
          const existingProject = grouped[dateKey].find(item => item.project.id === project.id);
          if (existingProject) {
            existingProject.tasks.push(task);
          } else {
            grouped[dateKey].push({ project, tasks: [task] });
          }
        });
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

  const getTaskCompletionsForDate = (date: Date) => {
    return taskCompletionsByDate[date.toDateString()] || [];
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
        {/* Month Navigation */}
        <div className="flex items-center justify-center mb-6">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-semibold text-foreground min-w-[200px] text-center mx-4">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-card border rounded-lg overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b text-center font-medium text-muted-foreground bg-muted">
            <div className="p-4">Sun</div>
            <div className="p-4">Mon</div>
            <div className="p-4">Tue</div>
            <div className="p-4">Wed</div>
            <div className="p-4">Thu</div>
            <div className="p-4">Fri</div>
            <div className="p-4">Sat</div>
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {daysInCalendar.map((date, index) => {
              const dayProjects = getProjectsForDate(date);
              const dayTaskCompletions = getTaskCompletionsForDate(date);
              const isCurrentMonthDay = isCurrentMonth(date);
              const isTodayDate = isToday(date);
              
              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[140px] p-2 border-r border-b border-border last:border-r-0",
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
                  
                  {/* Task Completions */}
                  {dayTaskCompletions.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {dayTaskCompletions.map(({ project, tasks }) => {
                          const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
                          const projectInitials = project.name
                            .split(' ')
                            .map(word => word[0])
                            .join('')
                            .substring(0, 2)
                            .toUpperCase();
                          
                          return (
                            <div
                              key={project.id}
                              className="relative group cursor-pointer"
                              onClick={() => router.push(`/projects/${project.id}`)}
                            >
                              {/* Project indicator with initials */}
                              <div
                                className="min-w-[28px] h-6 px-1 rounded-md flex items-center justify-center text-white text-xs font-bold hover:scale-105 transition-transform shadow-sm border border-white/20"
                                style={{ backgroundColor: project.color }}
                                title={`${project.name}: ${tasks.length} task(s) completed - Click to view project`}
                              >
                                <span className="mr-0.5">{projectInitials}</span>
                                <span className="text-[10px] bg-white/20 rounded-full w-4 h-4 flex items-center justify-center">
                                  {tasks.length}
                                </span>
                              </div>
                              
                              {/* Enhanced Tooltip */}
                              <div className="absolute top-8 left-0 z-10 bg-popover text-popover-foreground p-3 rounded-md shadow-lg border text-xs w-64 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <div className="flex items-center space-x-2 mb-2">
                                  <div 
                                    className="w-3 h-3 rounded-sm"
                                    style={{ backgroundColor: project.color }}
                                  ></div>
                                  <div className="font-medium text-sm">{project.name}</div>
                                </div>
                                <div className="text-muted-foreground mb-2">
                                  {tasks.length} task{tasks.length !== 1 ? 's' : ''} completed
                                  {totalEstimatedHours > 0 && ` • ${totalEstimatedHours}h estimated`}
                                </div>
                                <div className="space-y-1">
                                  {tasks.slice(0, 3).map(task => (
                                    <div key={task.id} className="flex items-center space-x-1 text-muted-foreground">
                                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                      <span className="truncate">{task.title}</span>
                                    </div>
                                  ))}
                                  {tasks.length > 3 && (
                                    <div className="text-muted-foreground">
                                      +{tasks.length - 3} more tasks
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Project summary text for quick scanning */}
                      {dayTaskCompletions.length > 0 && (
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          Worked on: {dayTaskCompletions.map(({ project }) => project.name).join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Due Date Projects */}
                  <div className="space-y-1">
                    {dayProjects.slice(0, 2).map(project => {
                      const timeRemaining = formatTimeRemaining(project.endDate!);
                      const progressColor = project.progress >= 80 ? 'text-green-600' : 
                                          project.progress >= 50 ? 'text-yellow-600' : 'text-red-600';
                      const progressBgColor = project.progress >= 80 ? 'bg-green-500' : 
                                            project.progress >= 50 ? 'bg-yellow-500' : 'bg-red-500';
                      return (
                        <div
                          key={project.id}
                          className="p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: project.color + '20', borderLeft: `3px solid ${project.color}` }}
                          title={`${project.name} - ${timeRemaining.text} • ${project.progress}% complete - Click to view project`}
                          onClick={() => router.push(`/projects/${project.id}`)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-1 flex-1 min-w-0">
                              <Folder className="w-3 h-3 flex-shrink-0" style={{ color: project.color }} />
                              <span className="truncate font-medium">{project.name}</span>
                            </div>
                            <div className={cn("text-xs font-medium ml-1", progressColor)}>
                              {project.progress}%
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                            <div 
                              className={cn("h-1.5 rounded-full transition-all", progressBgColor)}
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                          
                          <div className={cn(
                            "flex items-center space-x-1",
                            timeRemaining.isOverdue ? "text-red-600" : "text-muted-foreground"
                          )}>
                            <Clock className="w-2.5 h-2.5" />
                            <span>{timeRemaining.text}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              {project.tasks.filter(t => t.status === 'completed').length}/{project.tasks.length} tasks
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {dayProjects.length > 2 && (
                      <div className="text-xs text-muted-foreground p-1">
                        +{dayProjects.length - 2} more due
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Summary Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-2">This Month</h3>
            <div className="text-2xl font-bold text-primary">
              {Object.values(taskCompletionsByDate)
                .filter(dayCompletions => {
                  const dateKey = Object.keys(taskCompletionsByDate).find(key => taskCompletionsByDate[key] === dayCompletions);
                  if (!dateKey) return false;
                  const date = new Date(dateKey);
                  return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
                })
                .reduce((total, dayCompletions) => total + dayCompletions.reduce((sum, { tasks }) => sum + tasks.length, 0), 0)
              }
            </div>
            <div className="text-xs text-muted-foreground">Tasks completed</div>
          </div>
          
          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-2">Days Active</h3>
            <div className="text-2xl font-bold text-primary">
              {Object.keys(taskCompletionsByDate)
                .filter(dateKey => {
                  const date = new Date(dateKey);
                  return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
                })
                .length
              }
            </div>
            <div className="text-xs text-muted-foreground">Days with completed tasks</div>
          </div>
          
          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-2">Active Projects</h3>
            <div className="text-2xl font-bold text-primary">
              {projects.filter(p => !p.isDeleted && p.status === 'active').length}
            </div>
            <div className="text-xs text-muted-foreground">Currently active</div>
          </div>
        </div>
      </div>
    </div>
  );
} 