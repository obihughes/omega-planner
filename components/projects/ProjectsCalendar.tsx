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
    <div className="space-y-6 p-6">
      {/* Header with Navigation and Filter */}
      <div className="flex items-center justify-between">
        {/* Month Navigation */}
        <div className="flex items-center">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg hover:bg-accent transition-colors border border-border/50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <h3 className="text-xl font-semibold text-foreground min-w-[200px] text-center mx-4">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg hover:bg-accent transition-colors border border-border/50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Project Filter */}
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

      {/* Calendar Grid */}
      <div className="card-enhanced rounded-xl overflow-hidden shadow-lg border border-border/50">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-border/50 text-center font-semibold text-muted-foreground bg-card/80">
          <div className="p-4 text-sm">Sun</div>
          <div className="p-4 text-sm">Mon</div>
          <div className="p-4 text-sm">Tue</div>
          <div className="p-4 text-sm">Wed</div>
          <div className="p-4 text-sm">Thu</div>
          <div className="p-4 text-sm">Fri</div>
          <div className="p-4 text-sm">Sat</div>
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
                  "min-h-[130px] p-3 border-r border-b border-border/50 last:border-r-0 hover:bg-accent/30 transition-colors cursor-pointer",
                  !isCurrentMonthDay && "bg-muted/20 text-muted-foreground/50",
                  isTodayDate && "bg-primary/10 border-primary/20"
                )}
                onClick={() => handleDayClick(date)}
                title="Click to manage tasks"
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
                  <div className="mb-2">
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
                              className="min-w-[26px] h-6 px-1 rounded-md flex items-center justify-center text-white text-xs font-bold hover:scale-105 transition-all shadow-sm border border-white/20 cursor-pointer"
                              style={{ backgroundColor: project.color }}
                              title={`${project.name}: ${tasks.length} task(s) completed - Click to view project`}
                            >
                              <span className="mr-0.5">{projectInitials}</span>
                              <span className="text-[9px] bg-white/20 rounded-full w-3 h-3 flex items-center justify-center">
                                {tasks.length}
                              </span>
                            </div>
                            
                            {/* Enhanced Tooltip */}
                            <div className="absolute top-6 left-0 z-10 bg-popover text-popover-foreground p-2 rounded-md shadow-lg border text-xs w-56 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <div className="flex items-center space-x-2 mb-1">
                                <div 
                                  className="w-2 h-2 rounded-sm"
                                  style={{ backgroundColor: project.color }}
                                ></div>
                                <div className="font-medium text-xs">{project.name}</div>
                              </div>
                              <div className="text-muted-foreground mb-1 text-xs">
                                {tasks.length} task{tasks.length !== 1 ? 's' : ''} completed
                                {totalEstimatedHours > 0 && ` • ${totalEstimatedHours}h estimated`}
                              </div>
                              <div className="space-y-0.5">
                                {tasks.slice(0, 2).map(task => (
                                  <div key={task.id} className="flex items-center space-x-1 text-muted-foreground text-xs">
                                    <CheckCircle className="w-2 h-2 text-green-500 flex-shrink-0" />
                                    <span className="truncate">{task.title}</span>
                                  </div>
                                ))}
                                {tasks.length > 2 && (
                                  <div className="text-muted-foreground text-xs">
                                    +{tasks.length - 2} more tasks
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Task Due Dates */}
                {dayTasks.length > 0 && (
                  <div className="mb-2">
                    <div className="space-y-1">
                      {dayTasks.slice(0, 2).map(({ project, task }) => {
                        const isOverdue = new Date(task.dueDate!) < new Date() && task.status !== 'completed';
                        
                        return (
                          <div
                            key={task.id}
                            className="flex items-center gap-1 p-1 rounded text-xs cursor-pointer hover:bg-accent/20 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/projects/${project.id}`);
                            }}
                            title={`${task.title} - Click to view project`}
                          >
                            <AlertCircle className={cn(
                              "w-2.5 h-2.5 flex-shrink-0",
                              isOverdue ? "text-red-500" : "text-orange-500"
                            )} />
                            <div 
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
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
                          +{dayTasks.length - 2} more due
                        </div>
                      )}
                    </div>
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
                        className="p-2 rounded-lg text-xs cursor-pointer hover:scale-[1.02] transition-all shadow-sm border"
                        style={{ 
                          backgroundColor: project.color + '15', 
                          borderColor: project.color + '40',
                          borderLeftWidth: '3px',
                          borderLeftColor: project.color
                        }}
                        title={`${project.name} - ${timeRemaining.text} • ${project.progress}% complete - Click to view project`}
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center space-x-1 flex-1 min-w-0">
                            <Folder className="w-2.5 h-2.5 flex-shrink-0" style={{ color: project.color }} />
                            <span className="truncate font-medium text-xs">{project.name}</span>
                          </div>
                          <div className={cn("text-xs font-medium ml-1", progressColor)}>
                            {project.progress}%
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1 mb-0.5">
                          <div 
                            className={cn("h-1 rounded-full transition-all", progressBgColor)}
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        
                        <div className={cn(
                          "flex items-center space-x-1 text-xs",
                          timeRemaining.isOverdue ? "text-red-600" : "text-muted-foreground"
                        )}>
                          <Clock className="w-2 h-2" />
                          <span>{timeRemaining.text}</span>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-enhanced p-5 bg-card/60 backdrop-blur-sm">
          <h4 className="text-sm font-medium text-foreground mb-3">This Month</h4>
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
        
        <div className="card-enhanced p-5 bg-card/60 backdrop-blur-sm">
          <h4 className="text-sm font-medium text-foreground mb-3">Days Active</h4>
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
        
        <div className="card-enhanced p-5 bg-card/60 backdrop-blur-sm">
          <h4 className="text-sm font-medium text-foreground mb-3">Active Projects</h4>
          <div className="text-2xl font-bold text-primary">
            {projects.filter(p => !p.isDeleted && p.status === 'active').length}
          </div>
          <div className="text-xs text-muted-foreground">Currently active</div>
        </div>
      </div>
    </div>
  );
} 