'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  Clock, 
  CheckCircle2,
  Circle,
  Eye,
  Edit3,
  Timer,
  Coffee,
  Focus,
  Calendar
} from 'lucide-react';
import { Task } from '@/types';
import { useDailyPlanner } from '@/hooks/useDailyPlannerState';
import { formatTime } from '@/utils/formatters';
import { getDateKey } from '@/utils/dateUtils';
import { TASK_COLORS } from '@/lib/constants';

interface FocusViewProps {}

interface FocusSession {
  taskId: string;
  startTime: Date;
  duration: number; // in minutes
  type: 'work' | 'break';
  isActive: boolean;
}

export default function FocusView({}: FocusViewProps) {
  const {
    tasksByDate,
    pinnedTasks,
    generalPoolTasks,
    currentDayPoolTasks,
    openEditModal,
    openViewNotesModal,
    handleTaskCompletionToggle,
  } = useDailyPlanner();

  // Focus session state
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sessionType, setSessionType] = useState<'work' | 'break'>('work');
  const [workDuration, setWorkDuration] = useState(25); // Pomodoro default
  const [breakDuration, setBreakDuration] = useState(5);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Get today's tasks
  const todayTasks = useMemo(() => {
    const today = new Date();
    const todayKey = getDateKey(today);
    const scheduledTasks = tasksByDate.get(todayKey) || [];
    
    // Combine scheduled tasks, pinned tasks, and today's pool tasks
    const allTasks = [
      ...scheduledTasks,
      ...pinnedTasks.filter(task => !scheduledTasks.some(st => st.id === task.id)),
      ...currentDayPoolTasks.filter(task => 
        !scheduledTasks.some(st => st.id === task.id) &&
        !pinnedTasks.some(pt => pt.id === task.id)
      )
    ];

    // Sort by priority: incomplete tasks first, then by start time
    return allTasks.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      if (a.startHour !== undefined && b.startHour !== undefined) {
        return a.startHour - b.startHour;
      }
      return 0;
    });
  }, [tasksByDate, pinnedTasks, currentDayPoolTasks]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);

  const handleSessionComplete = () => {
    if (sessionType === 'work') {
      setCompletedSessions(prev => prev + 1);
      // Auto-start break after work session
      startBreakSession();
    } else {
      // Break completed, ready for next work session
      setSessionType('work');
      setTimeRemaining(workDuration * 60);
    }
  };

  const startWorkSession = (task?: Task) => {
    if (task) {
      setSelectedTask(task);
    }
    setSessionType('work');
    setTimeRemaining(workDuration * 60);
    setCurrentSession({
      taskId: task?.id || selectedTask?.id || '',
      startTime: new Date(),
      duration: workDuration,
      type: 'work',
      isActive: true
    });
    setIsRunning(true);
  };

  const startBreakSession = () => {
    setSessionType('break');
    setTimeRemaining(breakDuration * 60);
    setCurrentSession({
      taskId: '',
      startTime: new Date(),
      duration: breakDuration,
      type: 'break',
      isActive: true
    });
    setIsRunning(true);
  };

  const pauseSession = () => {
    setIsRunning(false);
  };

  const resumeSession = () => {
    setIsRunning(true);
  };

  const stopSession = () => {
    setIsRunning(false);
    setCurrentSession(null);
    setTimeRemaining(0);
  };

  const skipSession = () => {
    setIsRunning(false);
    handleSessionComplete();
  };

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getNextTask = () => {
    return todayTasks.find(task => !task.completed);
  };

  const currentTime = new Date();
  const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Focus className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-foreground">Focus Mode</h1>
          </div>
          <p className="text-muted-foreground">
            Distraction-free environment for deep work
          </p>
        </div>

        {/* Main Focus Area */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 mb-8">
          {/* Timer Display */}
          <div className="text-center mb-8">
            <div className={cn(
              "text-8xl font-mono font-bold mb-4",
              sessionType === 'work' ? "text-blue-600" : "text-green-600"
            )}>
              {formatTimeRemaining(timeRemaining)}
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className={cn(
                "px-4 py-2 rounded-full text-sm font-medium",
                sessionType === 'work' 
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
              )}>
                {sessionType === 'work' ? (
                  <>
                    <Clock className="w-4 h-4 inline mr-1" />
                    Work Session
                  </>
                ) : (
                  <>
                    <Coffee className="w-4 h-4 inline mr-1" />
                    Break Time
                  </>
                )}
              </div>
              
              {completedSessions > 0 && (
                <div className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                  {completedSessions} completed
                </div>
              )}
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-4">
              {!isRunning && timeRemaining === 0 && (
                <>
                  <Button
                    onClick={() => startWorkSession()}
                    size="lg"
                    className="flex items-center gap-2 px-8"
                  >
                    <Play className="w-5 h-5" />
                    Start Work
                  </Button>
                  <Button
                    onClick={startBreakSession}
                    variant="outline"
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    <Coffee className="w-5 h-5" />
                    Start Break
                  </Button>
                </>
              )}
              
              {timeRemaining > 0 && (
                <>
                  <Button
                    onClick={isRunning ? pauseSession : resumeSession}
                    size="lg"
                    variant={isRunning ? "outline" : "default"}
                    className="flex items-center gap-2 px-8"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-5 h-5" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Resume
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={stopSession}
                    variant="outline"
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    <Square className="w-5 h-5" />
                    Stop
                  </Button>
                  
                  <Button
                    onClick={skipSession}
                    variant="ghost"
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    <SkipForward className="w-5 h-5" />
                    Skip
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Current Task Display */}
          {selectedTask && (
            <div className="bg-muted/30 rounded-xl p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={() => handleTaskCompletionToggle(selectedTask.id)}
                      className="hover:scale-110 transition-transform"
                    >
                      {selectedTask.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                    <h3 className={cn(
                      "text-xl font-semibold",
                      selectedTask.completed && "line-through text-muted-foreground"
                    )}>
                      {selectedTask.name}
                    </h3>
                  </div>
                  
                  {selectedTask.notes && (
                    <p className="text-muted-foreground mb-4">
                      {selectedTask.notes}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {selectedTask.startHour !== undefined && (
                      <span>
                        <Clock className="w-4 h-4 inline mr-1" />
                        {formatTime(selectedTask.startHour)} - {formatTime(selectedTask.startHour + selectedTask.duration)}
                      </span>
                    )}
                    <span>
                      <Timer className="w-4 h-4 inline mr-1" />
                      {selectedTask.duration}h estimated
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openViewNotesModal(selectedTask)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(selectedTask)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Task Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Today's Tasks */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Tasks
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {todayTasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No tasks for today
                </p>
              ) : (
                todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                      selectedTask?.id === task.id 
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                        : "border-border hover:border-muted-foreground",
                      task.completed && "opacity-60"
                    )}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskCompletionToggle(task.id);
                        }}
                        className="mt-0.5 hover:scale-110 transition-transform"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={cn(
                          "font-medium truncate",
                          task.completed && "line-through text-muted-foreground"
                        )}>
                          {task.name}
                        </h4>
                        
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          {task.startHour !== undefined && (
                            <span>
                              <Clock className="w-3 h-3 inline mr-1" />
                              {formatTime(task.startHour)}
                            </span>
                          )}
                          <span>
                            <Timer className="w-3 h-3 inline mr-1" />
                            {task.duration}h
                          </span>
                        </div>
                      </div>
                      
                      {selectedTask?.id === task.id && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            startWorkSession(task);
                          }}
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          Focus
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Session Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Session Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Work Duration (minutes)
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWorkDuration(Math.max(5, workDuration - 5))}
                  >
                    -
                  </Button>
                  <span className="w-16 text-center font-mono">{workDuration}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWorkDuration(Math.min(120, workDuration + 5))}
                  >
                    +
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Break Duration (minutes)
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBreakDuration(Math.max(1, breakDuration - 1))}
                  >
                    -
                  </Button>
                  <span className="w-16 text-center font-mono">{breakDuration}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBreakDuration(Math.min(30, breakDuration + 1))}
                  >
                    +
                  </Button>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">
                    <strong>Sessions completed:</strong> {completedSessions}
                  </p>
                  <p>
                    <strong>Next task:</strong> {getNextTask()?.name || 'None'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 