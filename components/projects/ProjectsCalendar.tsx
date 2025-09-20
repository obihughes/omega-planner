'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Project, ProjectTask } from '@/types';
import { ChevronLeft, ChevronRight, Clock, Folder, CheckCircle, Play, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getDateKey, dateFromDateKey, getTodayDateKey } from '@/utils/dateUtils';

interface ProjectsCalendarProps {
  projects: Project[];
}

export function ProjectsCalendar({ projects }: ProjectsCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
    let filtered = projects.filter(p => !p.isDeleted);
    
    if (selectedProjectId !== 'all') {
      filtered = filtered.filter(p => p.id === selectedProjectId);
    }
    
    return filtered;
  }, [projects, selectedProjectId]);

  // Group projects by due date
  const projectsByDate = useMemo(() => {
    const grouped: { [key: string]: Project[] } = {};
    
    filteredProjects
      .filter(project => !project.isDeleted && project.endDate)
      .forEach(project => {
        const dateKey = getDateKey(new Date(project.endDate!));
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(project);
      });
    
    return grouped;
  }, [filteredProjects]);

  // Group tasks by start date
  const taskStartDatesByDate = useMemo(() => {
    const grouped: { [key: string]: { project: Project; task: ProjectTask }[] } = {};
    
    filteredProjects
      .filter(project => !project.isDeleted)
      .forEach(project => {
        project.tasks
          .filter(task => task.startDate && task.status !== 'completed')
          .forEach(task => {
            const dateKey = getDateKey(new Date(task.startDate!));
            if (!grouped[dateKey]) {
              grouped[dateKey] = [];
            }
            grouped[dateKey].push({ project, task });
          });
      });
    
    return grouped;
  }, [filteredProjects]);

  // Group tasks by due date
  const taskDueDatesByDate = useMemo(() => {
    const grouped: { [key: string]: { project: Project; task: ProjectTask }[] } = {};
    
    filteredProjects
      .filter(project => !project.isDeleted)
      .forEach(project => {
        project.tasks
          .filter(task => task.dueDate && task.status !== 'completed')
          .forEach(task => {
            const dateKey = getDateKey(new Date(task.dueDate!));
            if (!grouped[dateKey]) {
              grouped[dateKey] = [];
            }
            grouped[dateKey].push({ project, task });
          });
      });
    
    return grouped;
  }, [filteredProjects]);

  // Group completed tasks by completion date for minimal display
  const taskCompletionsByDate = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    
    filteredProjects
      .filter(project => !project.isDeleted)
      .forEach(project => {
        const completedTasks = project.tasks.filter(task => 
          task.status === 'completed' && task.completedAt
        );
        
        completedTasks.forEach(task => {
          const dateKey = getDateKey(new Date(task.completedAt!));
          
          grouped[dateKey] = (grouped[dateKey] || 0) + 1;
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

  const getProjectsForDate = (date: Date) => {
    const dateKey = getDateKey(date);
    return projectsByDate[dateKey] || [];
  };

  const getTaskStartsForDate = (date: Date) => {
    const dateKey = getDateKey(date);
    return taskStartDatesByDate[dateKey] || [];
  };

  const getTaskDuesForDate = (date: Date) => {
    const dateKey = getDateKey(date);
    return taskDueDatesByDate[dateKey] || [];
  };

  // Get completed tasks for a date (by completion date)
  const getCompletedTasksForDate = (date: Date) => {
    const dateKey = getDateKey(date);
    const results: { project: Project; task: ProjectTask }[] = [];
    filteredProjects
      .filter(project => !project.isDeleted)
      .forEach(project => {
        project.tasks
          .filter(task => task.status === 'completed' && task.completedAt && getDateKey(task.completedAt) === dateKey)
          .forEach(task => results.push({ project, task }));
      });
    return results;
  };

  const getCompletedCountForDate = (date: Date) => {
    const dateKey = getDateKey(date);
    return taskCompletionsByDate[dateKey] || 0;
  };

  const getCompletedTitlesForDate = (date: Date) => {
    const dateKey = getDateKey(date);
    const titles: string[] = [];
    filteredProjects
      .filter(project => !project.isDeleted)
      .forEach(project => {
        project.tasks
          .filter(task => task.status === 'completed' && task.completedAt && getDateKey(task.completedAt) === dateKey)
          .forEach(task => titles.push(task.title));
      });
    return titles;
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleProjectClick = (projectId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    router.push(`/projects/${projectId}`);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
  };

  const formatTimeRemaining = (dueDate: string): { text: string; isOverdue: boolean } => {
    // Normalize to date keys and compare day-only
    const todayKey = getTodayDateKey();
    const dueKey = getDateKey(dueDate);

    if (dueKey < todayKey) {
      // Compute absolute days overdue
      const due = dateFromDateKey(dueKey);
      const today = dateFromDateKey(todayKey);
      const diffDays = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      return { text: `${diffDays}d overdue`, isOverdue: true };
    }
    if (dueKey === todayKey) return { text: 'Due today', isOverdue: false };

    const due = dateFromDateKey(dueKey);
    const today = dateFromDateKey(todayKey);
    const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return { text: 'Due tomorrow', isOverdue: false };
    return { text: `${diffDays}d left`, isOverdue: false };
  };

  const getActiveTasksCount = () => {
    return filteredProjects
      .filter(p => !p.isDeleted)
      .reduce((total, project) => total + project.tasks.filter(t => t.status !== 'completed').length, 0);
  };

  const getMonthlyCompletedCount = () => {
    return Object.keys(taskCompletionsByDate)
      .filter(dateKey => {
        const [year, month] = dateKey.split('-').map(Number);
        return month - 1 === currentDate.getMonth() && year === currentDate.getFullYear();
      })
      .reduce((total, dateKey) => total + taskCompletionsByDate[dateKey], 0);
  };

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="h-9 w-9 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="min-w-[160px] text-center">
            <span className="text-lg font-semibold text-foreground">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="h-9 w-9 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {!isCurrentMonth(new Date()) && (
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="h-9 px-3 ml-2 text-xs"
            >
              Today
            </Button>
          )}
        </div>
      </div>

      {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center max-w-md">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {selectedProjectId !== 'all' ? 'No projects in this selection' : 'No projects yet'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {selectedProjectId !== 'all' 
                  ? 'The selected project filter has no results.'
                  : 'Create your first project to see it on the calendar.'
                }
              </p>
              {selectedProjectId !== 'all' && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedProjectId('all')}
                  className="mr-3"
                >
                  Show All Projects
                </Button>
              )}
              <Button
                onClick={() => router.push('/projects')}
                className="flex items-center gap-2"
              >
                <Folder className="w-4 h-4" />
                Go to Projects
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-card/30 rounded-xl border border-border/20 overflow-hidden shadow-sm">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-border/20 bg-muted/10">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                <div key={day} className="py-2 px-1 text-center font-medium text-muted-foreground text-xs border-r border-border/20 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="grid grid-cols-7 divide-x divide-border/20">
              {daysInCalendar.map((date, index) => {
                const dayProjects = getProjectsForDate(date);
                const dayTaskStarts = getTaskStartsForDate(date);
                const dayTaskDues = getTaskDuesForDate(date);
                const completedCount = getCompletedCountForDate(date);
                const completedTasks = completedCount > 0 ? getCompletedTasksForDate(date) : [];
                const isCurrentMonthDay = isCurrentMonth(date);
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                const isTodayDate = isToday(date);
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "min-h-[80px] p-1.5 border-b border-border/20 hover:bg-accent/10 transition-all duration-200 cursor-pointer group",
                      !isCurrentMonthDay && "bg-muted/20 text-muted-foreground/60",
                      isTodayDate && "bg-primary/5 border-primary/20 border-l-2 border-l-primary",
                      isSelected && "ring-1 ring-primary"
                    )}
                    onClick={() => handleDayClick(date)}
                    title="Click to view tasks for this day"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className={cn(
                        "text-xs font-semibold",
                        !isCurrentMonthDay && "text-muted-foreground",
                        isTodayDate && "text-primary"
                      )}>
                        {date.getDate()}
                      </div>
                      
                      {/* Completed count badge */}
                      {completedCount > 0 && (
                        <div
                          className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 rounded-full"
                          title={getCompletedTitlesForDate(date).join('\n')}
                        >
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span className="text-xs text-green-700 dark:text-green-300 font-medium">{completedCount}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1.5">
                      {/* Completed Tasks */}
                      {completedTasks.slice(0, 2).map(({ project, task }) => (
                        <div
                          key={`completed-${task.id}`}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[11px] cursor-pointer transition-colors border-l-2 bg-green-50/30 dark:bg-green-900/10 hover:bg-green-50 dark:hover:bg-green-900/20"
                          style={{ borderLeftColor: project.color }}
                          onClick={(e) => handleProjectClick(project.id, e)}
                          title={`${task.title} completed`}
                        >
                          <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="truncate font-medium text-foreground/80 flex-1 line-through">
                            {task.title}
                          </span>
                        </div>
                      ))}
                      {/* Task Start Dates */}
                      {dayTaskStarts.slice(0, 2).map(({ project, task }) => (
                        <div
                          key={`start-${task.id}`}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[11px] cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-l-2 bg-blue-50/30 dark:bg-blue-900/10"
                          style={{ borderLeftColor: project.color }}
                          onClick={(e) => handleProjectClick(project.id, e)}
                          title={`${task.title} starts today`}
                        >
                          <Play className="w-3 h-3 text-blue-600 flex-shrink-0" />
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="truncate font-medium text-foreground flex-1">
                            {task.title}
                          </span>
                        </div>
                      ))}

                      {/* Task Due Dates */}
                      {dayTaskDues.slice(0, 2).map(({ project, task }) => {
                        const dueKey = getDateKey(task.dueDate!);
                        const isOverdue = (dueKey < getTodayDateKey()) && task.status !== 'completed';
                        
                        return (
                          <div
                            key={`due-${task.id}`}
                            className={cn(
                              "flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[11px] cursor-pointer transition-colors border-l-2",
                              isOverdue 
                                ? "bg-red-50/30 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20" 
                                : "bg-orange-50/30 dark:bg-orange-900/10 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            )}
                            style={{ borderLeftColor: project.color }}
                            onClick={(e) => handleProjectClick(project.id, e)}
                            title={`${task.title} ${isOverdue ? 'is overdue' : 'due today'}`}
                          >
                            <Calendar className={cn(
                              "w-3 h-3 flex-shrink-0",
                              isOverdue ? "text-red-600" : "text-orange-600"
                            )} />
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: project.color }}
                            />
                            <span className={cn(
                              "truncate font-medium flex-1",
                              isOverdue ? "text-red-700 dark:text-red-300" : "text-foreground"
                            )}>
                              {task.title}
                            </span>
                          </div>
                        );
                      })}
                      
                      {/* Project Due Dates */}
                      {dayProjects.slice(0, 1).map(project => {
                        const timeRemaining = formatTimeRemaining(project.endDate!);
                        return (
                          <div
                            key={project.id}
                            className="p-1.5 rounded-md text-[11px] cursor-pointer hover:shadow-sm transition-all border border-border/40"
                            style={{ 
                              backgroundColor: project.color + '10', 
                              borderColor: project.color + '30',
                              borderLeftWidth: '3px',
                              borderLeftColor: project.color
                            }}
                            title={`${project.name} - ${timeRemaining.text} • ${project.progress}% complete`}
                            onClick={(e) => handleProjectClick(project.id, e)}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="truncate font-medium text-xs flex-1">{project.name}</span>
                              <span className="text-[10px] ml-2 bg-background/50 px-1 py-0.5 rounded">{project.progress}%</span>
                            </div>
                            
                            <div className={cn(
                              "flex items-center gap-1 text-[11px]",
                              timeRemaining.isOverdue ? "text-red-600" : "text-muted-foreground"
                            )}>
                              <Clock className="w-2.5 h-2.5" />
                              <span>{timeRemaining.text}</span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Overflow indicators */}
                      {(completedTasks.length > 2 || dayTaskStarts.length > 2 || dayTaskDues.length > 2 || dayProjects.length > 1) && (
                        <div className="text-[11px] text-muted-foreground px-1.5 py-0.5 bg-muted/20 rounded-md">
                          {completedTasks.length > 2 && `+${completedTasks.length - 2} completed`}
                          {dayTaskStarts.length > 2 && `${completedTasks.length > 2 ? ' ' : ''}+${dayTaskStarts.length - 2} starting`}
                          {dayTaskDues.length > 2 && ` +${dayTaskDues.length - 2} due`}
                          {dayProjects.length > 1 && ` +${dayProjects.length - 1} projects`}
                        </div>
                      )}
                    </div>

                    {/* Empty day indicator */}
                    {dayProjects.length === 0 && dayTaskStarts.length === 0 && dayTaskDues.length === 0 && completedCount === 0 && isCurrentMonthDay && (
                      <div className="text-center py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-[11px] text-muted-foreground">
                          Free day
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected day tasks list (from Tasks view) */}
        {selectedDate && (
          <div className="mt-4 bg-card/50 border border-border/20 rounded-lg">
            <div className="p-3 border-b border-border/20 flex items-center justify-between">
              <div className="text-sm font-medium">
                Selected day — {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>Clear</Button>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto space-y-1">
              {(() => {
                const dateKey = getDateKey(selectedDate);
                const tasksForDate: { project: Project; task: ProjectTask }[] = [];
                filteredProjects.forEach(project => {
                  project.tasks.forEach(task => {
                    if (task.dueDate && getDateKey(task.dueDate) === dateKey) {
                      tasksForDate.push({ project, task });
                    }
                  });
                });
                if (tasksForDate.length === 0) {
                  return <div className="text-xs text-muted-foreground">No tasks for this day</div>;
                }
                return (
                  <ul className="space-y-1">
                    {tasksForDate.map(({ project, task }) => (
                      <li key={task.id} className="flex items-center gap-2 text-xs">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                        <span className="font-medium truncate">{task.title}</span>
                        <span className="text-muted-foreground">({project.name})</span>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          </div>
        )}
    </div>
  );
} 