'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Project, ProjectTask } from '@/types';
import { ChevronLeft, ChevronRight, Clock, Folder, CheckCircle, Filter, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ProjectsCalendarProps {
  projects: Project[];
}

export function ProjectsCalendar({ projects }: ProjectsCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

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

  // Filter projects based on selection
  const filteredProjects = useMemo(() => {
    if (selectedProjectId === 'all') return projects;
    return projects.filter(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Group projects by due date
  const projectsByDate = useMemo(() => {
    const grouped: { [key: string]: Project[] } = {};
    
    filteredProjects
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
  }, [filteredProjects]);

  // Group tasks by due date
  const tasksByDate = useMemo(() => {
    const grouped: { [key: string]: { project: Project; task: ProjectTask }[] } = {};
    
    filteredProjects
      .filter(project => !project.isDeleted)
      .forEach(project => {
        project.tasks
          .filter(task => task.dueDate && task.status !== 'completed')
          .forEach(task => {
            const dueDate = new Date(task.dueDate!);
            const dateKey = dueDate.toDateString();
            if (!grouped[dateKey]) {
              grouped[dateKey] = [];
            }
            grouped[dateKey].push({ project, task });
          });
      });
    
    return grouped;
  }, [filteredProjects]);

  // Group completed tasks by completion date and project
  const taskCompletionsByDate = useMemo(() => {
    const grouped: { [key: string]: { project: Project; tasks: ProjectTask[] }[] } = {};
    
    filteredProjects
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
    }, [filteredProjects]);

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

  const getTasksForDate = (date: Date) => {
    return tasksByDate[date.toDateString()] || [];
  };

  const handleDayClick = (date: Date) => {
    // For now, navigate to projects tasks view with a filter hint
    router.push('/projects/tasks');
  };

  const formatTimeRemaining = (dueDate: string): { text: string; isOverdue: boolean } => {
    const now = new Date();
    const due = new Date(dueDate);
    due.setHours(23, 59, 59, 999);

    const diffMs = due.getTime() - now.getTime();
    const dayMs = 1000 * 60 * 60 * 24;
    const diffDays = diffMs >= 0 ? Math.floor(diffMs / dayMs) : Math.ceil(diffMs / dayMs);

    if (diffDays < -1) return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
    if (diffDays === -1) return { text: `1d overdue`, isOverdue: true };
    if (diffDays === 0) return { text: 'Due today', isOverdue: false };
    if (diffDays === 1) return { text: 'Due tomorrow', isOverdue: false };
    return { text: `${diffDays}d left`, isOverdue: false };
  };

  return (
    <div className="space-y-4">
      {/* Compact Header with Navigation and Filter */}
      <div className="flex items-center justify-between py-2">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h3 className="text-xl font-semibold text-foreground min-w-[180px] text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Project Filter and Stats in one line */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>{projects.filter(p => !p.isDeleted && p.status === 'active').length} active</span>
            <span>•</span>
            <span>{Object.values(taskCompletionsByDate)
              .filter(dayCompletions => {
                const dateKey = Object.keys(taskCompletionsByDate).find(key => taskCompletionsByDate[key] === dayCompletions);
                if (!dateKey) return false;
                const date = new Date(dateKey);
                return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
              })
              .reduce((total, dayCompletions) => total + dayCompletions.reduce((sum, { tasks }) => sum + tasks.length, 0), 0)
            } completed this month</span>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
                {selectedProjectId !== 'all' && (
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Filter by Project</h4>
                  {selectedProjectId !== 'all' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedProjectId('all')} 
                      className="h-auto p-1 text-xs"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedProjectId('all')}
                    className={cn(
                      "w-full text-left px-2 py-1 text-xs rounded transition-colors",
                      selectedProjectId === 'all'
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    )}
                  >
                    All Projects
                  </button>
                  {projects
                    .filter(p => !p.isDeleted)
                    .map(project => (
                      <button
                        key={project.id}
                        onClick={() => setSelectedProjectId(project.id)}
                        className={cn(
                          "w-full text-left px-2 py-1 text-xs rounded transition-colors flex items-center gap-2",
                          selectedProjectId === project.id
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                        )}
                      >
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </button>
                    ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Compact Calendar Grid */}
      <div className="bg-card rounded-lg overflow-hidden border border-border/30">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-border/30 text-center font-medium text-muted-foreground bg-muted/20">
          <div className="py-2 text-sm">Sun</div>
          <div className="py-2 text-sm">Mon</div>
          <div className="py-2 text-sm">Tue</div>
          <div className="py-2 text-sm">Wed</div>
          <div className="py-2 text-sm">Thu</div>
          <div className="py-2 text-sm">Fri</div>
          <div className="py-2 text-sm">Sat</div>
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {daysInCalendar.map((date, index) => {
            const dayProjects = getProjectsForDate(date);
            const dayTaskCompletions = getTaskCompletionsForDate(date);
            const dayTasks = getTasksForDate(date);
            const isCurrentMonthDay = isCurrentMonth(date);
            const isTodayDate = isToday(date);
            
            return (
              <div
                key={index}
                className={cn(
                  "min-h-[100px] p-2 border-r border-b border-border/30 last:border-r-0 hover:bg-accent/20 transition-colors cursor-pointer",
                  !isCurrentMonthDay && "bg-muted/10 text-muted-foreground/50",
                  isTodayDate && "bg-primary/10 border-primary/20"
                )}
                onClick={() => handleDayClick(date)}
                title="Click to manage tasks"
              >
                <div className={cn(
                  "text-sm font-medium mb-1",
                  !isCurrentMonthDay && "text-muted-foreground",
                  isTodayDate && "text-primary font-bold"
                )}>
                  {date.getDate()}
                </div>
                
                {/* Task Completions */}
                {dayTaskCompletions.length > 0 && (
                  <div className="mb-1">
                    <div className="flex flex-wrap gap-1">
                      {dayTaskCompletions.map(({ project, tasks }) => {
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
                            <div
                              className="min-w-[22px] h-5 px-1 rounded text-white text-xs font-bold hover:scale-105 transition-all shadow-sm border border-white/20 cursor-pointer flex items-center justify-center"
                              style={{ backgroundColor: project.color }}
                              title={`${project.name}: ${tasks.length} task(s) completed`}
                            >
                              <span className="mr-0.5">{projectInitials}</span>
                              <span className="text-[8px] bg-white/20 rounded-full w-2.5 h-2.5 flex items-center justify-center">
                                {tasks.length}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Task Due Dates */}
                {dayTasks.length > 0 && (
                  <div className="mb-1">
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 2).map(({ project, task }) => {
                        const isOverdue = new Date(task.dueDate!) < new Date() && task.status !== 'completed';
                        
                        return (
                          <div
                            key={task.id}
                            className="flex items-center gap-1 px-1 py-0.5 rounded text-xs cursor-pointer hover:bg-accent/20 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/projects/${project.id}`);
                            }}
                            title={`${task.title}`}
                          >
                            <AlertCircle className={cn(
                              "w-2 h-2 flex-shrink-0",
                              isOverdue ? "text-red-500" : "text-orange-500"
                            )} />
                            <div 
                              className="w-1 h-1 rounded-full flex-shrink-0"
                              style={{ backgroundColor: project.color }}
                            />
                            <span className={cn(
                              "truncate font-medium",
                              isOverdue ? "text-red-600" : "text-foreground"
                            )}>
                              {task.title}
                            </span>
                          </div>
                        );
                      })}
                      {dayTasks.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{dayTasks.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Due Date Projects */}
                <div className="space-y-0.5">
                  {dayProjects.slice(0, 1).map(project => {
                    const timeRemaining = formatTimeRemaining(project.endDate!);
                    return (
                      <div
                        key={project.id}
                        className="p-1.5 rounded text-xs cursor-pointer hover:scale-[1.02] transition-all shadow-sm border"
                        style={{ 
                          backgroundColor: project.color + '15', 
                          borderColor: project.color + '40',
                          borderLeftWidth: '2px',
                          borderLeftColor: project.color
                        }}
                        title={`${project.name} - ${timeRemaining.text} • ${project.progress}% complete`}
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="truncate font-medium text-xs flex-1">{project.name}</span>
                          <span className="text-xs ml-1">{project.progress}%</span>
                        </div>
                        
                        <div className={cn(
                          "flex items-center gap-1 text-xs",
                          timeRemaining.isOverdue ? "text-red-600" : "text-muted-foreground"
                        )}>
                          <Clock className="w-2 h-2" />
                          <span>{timeRemaining.text}</span>
                        </div>
                      </div>
                    );
                  })}
                  {dayProjects.length > 1 && (
                    <div className="text-xs text-muted-foreground px-1">
                      +{dayProjects.length - 1} more due
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 