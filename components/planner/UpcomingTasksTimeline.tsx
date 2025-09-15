import React, { useMemo } from 'react';
import { Task } from '@/types/planner';
import { ProjectTask } from '@/types/projects';
import { useProjects } from '@/hooks/useProjects';
import { useDailyPlanner } from '@/hooks/useDailyPlannerState';
import { getDateKey, getTodayDateKey, formatDueDate } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { Clock, Calendar, User } from 'lucide-react';

interface TaskWithProject extends ProjectTask {
  projectId: string;
  projectName: string;
  projectColor: string;
}

interface UpcomingTaskWithProject extends TaskWithProject {
  daysUntil: number;
  dueType: 'today' | 'tomorrow' | 'this-week' | 'later';
}

interface UpcomingTasksTimelineProps {
  className?: string;
}

export function UpcomingTasksTimeline({ className }: UpcomingTasksTimelineProps) {
  const { projects } = useProjects();
  const { pinnedTasks } = useDailyPlanner();

  // Get all upcoming tasks from projects
  const upcomingTasks = useMemo((): UpcomingTaskWithProject[] => {
    const todayKey = getTodayDateKey();
    
    // Get tasks from projects
    const projectTasks: TaskWithProject[] = projects
      .filter(p => !p.isDeleted)
      .flatMap(project => 
        project.tasks
          .filter(task => task.dueDate && task.status !== 'completed')
          .map(task => ({
            ...task,
            projectId: project.id,
            projectName: project.name,
            projectColor: project.color
          }))
      );

    // Convert to upcoming tasks with days until calculation
    const tasksWithDaysUntil: UpcomingTaskWithProject[] = projectTasks
      .map(task => {
        const taskDueDateKey = getDateKey(task.dueDate!);
        const todayDate = new Date(todayKey);
        const taskDate = new Date(taskDueDateKey);
        const diffTime = taskDate.getTime() - todayDate.getTime();
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let dueType: 'today' | 'tomorrow' | 'this-week' | 'later';
        if (daysUntil <= 0) dueType = 'today';
        else if (daysUntil === 1) dueType = 'tomorrow';
        else if (daysUntil <= 7) dueType = 'this-week';
        else dueType = 'later';

        return {
          ...task,
          daysUntil,
          dueType
        };
      })
      // Only show upcoming tasks (today and future)
      .filter(task => task.daysUntil >= 0)
      // Sort by days until due, then by priority
      .sort((a, b) => {
        if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
        
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      });

    return tasksWithDaysUntil;
  }, [projects]);

  // Group tasks by due type
  const groupedTasks = useMemo(() => {
    const groups = {
      today: upcomingTasks.filter(t => t.dueType === 'today'),
      tomorrow: upcomingTasks.filter(t => t.dueType === 'tomorrow'),
      thisWeek: upcomingTasks.filter(t => t.dueType === 'this-week'),
      later: upcomingTasks.filter(t => t.dueType === 'later').slice(0, 10) // Limit later tasks
    };
    return groups;
  }, [upcomingTasks]);

  const formatDaysUntil = (daysUntil: number) => {
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil <= 7) return `${daysUntil} days`;
    return `${daysUntil} days`;
  };

  const TaskItem = ({ task }: { task: UpcomingTaskWithProject }) => (
    <div className="flex items-start gap-2 p-2 bg-card rounded border border-border/50 hover:border-border transition-colors">
      <div 
        className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
        style={{ backgroundColor: task.projectColor }}
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-xs text-foreground line-clamp-2 leading-tight">
          {task.title}
        </h4>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <span className="truncate max-w-16">{task.projectName}</span>
          <span>•</span>
          <span className={cn(
            "font-medium text-xs",
            task.priority === 'urgent' && "text-red-600",
            task.priority === 'high' && "text-orange-600",
            task.priority === 'medium' && "text-blue-600"
          )}>
            {task.priority.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className={cn(
            "text-xs font-medium",
            task.dueType === 'today' && "text-blue-600",
            task.dueType === 'tomorrow' && "text-yellow-600",
            task.dueType === 'this-week' && "text-green-600",
            task.dueType === 'later' && "text-muted-foreground"
          )}>
            {formatDaysUntil(task.daysUntil)}
          </div>
          {task.dueDate && (
            <div className="text-xs text-muted-foreground">
              {new Date(task.dueDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const SectionHeader = ({ title, count, color }: { title: string; count: number; color: string }) => (
    <div className="flex items-center gap-2 mb-2">
      <div className={cn("w-1.5 h-1.5 rounded-full", color)} />
      <h3 className="font-semibold text-xs text-foreground">
        {title} ({count})
      </h3>
    </div>
  );

  return (
    <div className={cn("bg-background border border-border rounded-lg flex flex-col h-fit", className)}>
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm text-foreground">Upcoming Tasks</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Tasks due soon
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-96">
        {/* Today */}
        {groupedTasks.today.length > 0 && (
          <div>
            <SectionHeader title="Due Today" count={groupedTasks.today.length} color="bg-blue-500" />
            <div className="space-y-1.5">
              {groupedTasks.today.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Tomorrow */}
        {groupedTasks.tomorrow.length > 0 && (
          <div>
            <SectionHeader title="Due Tomorrow" count={groupedTasks.tomorrow.length} color="bg-yellow-500" />
            <div className="space-y-1.5">
              {groupedTasks.tomorrow.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* This Week */}
        {groupedTasks.thisWeek.length > 0 && (
          <div>
            <SectionHeader title="This Week" count={groupedTasks.thisWeek.length} color="bg-green-500" />
            <div className="space-y-1.5">
              {groupedTasks.thisWeek.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Later */}
        {groupedTasks.later.length > 0 && (
          <div>
            <SectionHeader title="Later" count={groupedTasks.later.length} color="bg-gray-400" />
            <div className="space-y-1.5">
              {groupedTasks.later.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {upcomingTasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm">No upcoming tasks</p>
            <p className="text-xs">All caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
} 