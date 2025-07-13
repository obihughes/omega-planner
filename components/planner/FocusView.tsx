'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  CheckCircle2,
  Eye,
  Edit3,
  Timer,
  ChevronRight,
  History,
  Target,
  Settings,
} from 'lucide-react';
import { Task } from '@/types';
import { useDailyPlanner } from '@/hooks/useDailyPlannerState';
import { formatTime } from '@/utils/formatters';
import { getDateKey } from '@/utils/dateUtils';

interface FocusSession {
  id: string;
  taskName: string;
  taskId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  completed: boolean;
}

// Focus history storage utilities
const FOCUS_HISTORY_KEY = 'focus-session-history';
const FOCUS_SESSION_STATE_KEY = 'focus-session-state';

const saveFocusHistory = (sessions: FocusSession[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FOCUS_HISTORY_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error('❌ [FocusView] Failed to save focus history:', err);
  }
};

const loadFocusHistory = (): FocusSession[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(FOCUS_HISTORY_KEY);
    const sessions = stored ? JSON.parse(stored) : [];
    return sessions;
  } catch (err) {
    console.error('❌ [FocusView] Failed to load focus history:', err);
    return [];
  }
};

const saveFocusSessionState = (sessionState: {
  timeRemaining: number;
  isRunning: boolean;
  workDuration: number;
  currentTaskId?: string;
  sessionStartTime?: string;
  lastUpdateTime: number;
}) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FOCUS_SESSION_STATE_KEY, JSON.stringify(sessionState));
  } catch (err) {
    console.error('❌ [FocusView] Failed to save session state:', err);
  }
};

const loadFocusSessionState = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(FOCUS_SESSION_STATE_KEY);
    const state = stored ? JSON.parse(stored) : null;
    return state;
  } catch (err) {
    console.error('❌ [FocusView] Failed to load session state:', err);
    return null;
  }
};

const clearFocusSessionState = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(FOCUS_SESSION_STATE_KEY);
  } catch (err) {
    console.error('❌ [FocusView] Failed to clear session state:', err);
  }
};

export default function FocusView() {
  const {
    tasksByDate,
    topDayOffset,
    pinnedTasks,
    currentDayPoolTasks,
    openEditModal,
    openViewNotesModal,
    handleTaskCompletionToggle,
  } = useDailyPlanner();

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [workDuration, setWorkDuration] = useState(25);
  const [focusHistory, setFocusHistory] = useState<FocusSession[]>([]);
  const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const todayIncompleteTasks = useMemo(() => {
    const today = new Date();
    const todayKey = getDateKey(today);
    const scheduledTasks = tasksByDate.get(todayKey) || [];
    
    const allTasks = [
      ...scheduledTasks,
      ...pinnedTasks.filter((task: any) => !scheduledTasks.some(st => st.id === task.id)),
      ...currentDayPoolTasks.filter((task: any) => 
        !scheduledTasks.some(st => st.id === task.id) &&
        !pinnedTasks.some((pt: any) => pt.id === task.id)
      )
    ];

    const incompleteTasks = allTasks
      .filter(task => !task.completed)
      .sort((a, b) => (a.startHour || 24) - (b.startHour || 24));

    return incompleteTasks;
  }, [tasksByDate, pinnedTasks, currentDayPoolTasks]);

  // Get current task
  const currentTask = useMemo(() => {
    if (!currentTaskId) {
      const firstTask = todayIncompleteTasks[0] || null;
      return firstTask;
    }
    
    const task = todayIncompleteTasks.find(t => t.id === currentTaskId);
    return task || null;
  }, [currentTaskId, todayIncompleteTasks]);

  // Get the next task (just the immediate next one)
  const nextTask = useMemo(() => {
    const today = new Date();
    const currentTime = today.getHours() + today.getMinutes() / 60;
    
    // Get today's tasks
    const todayTasks = tasksByDate.get(getDateKey(today)) || [];
    
    // Find upcoming tasks (not completed and starts after current time)
    const upcomingTasks = todayTasks
      .filter(task => !task.completed && task.startHour > currentTime)
      .sort((a, b) => a.startHour - b.startHour);
    
    return upcomingTasks.length > 0 ? upcomingTasks[0] : null;
  }, [tasksByDate]);

  // Load focus history and session state on mount
  useEffect(() => {
    const savedHistory = loadFocusHistory();
    setFocusHistory(savedHistory);
    
    // Defer session restoration until task data is loaded
    if (todayIncompleteTasks.length === 0) {
      return; 
    }

    const savedState = loadFocusSessionState();
    
    if (savedState && savedState.currentTaskId) {
      // Find the task that was being focused on
      const restoredTask = todayIncompleteTasks.find(t => t.id === savedState.currentTaskId);

      if (!restoredTask) {
        clearFocusSessionState();
        return;
      }
      
      setCurrentTaskId(savedState.currentTaskId);
      
      const now = Date.now();
      const timeSinceLastUpdate = now - savedState.lastUpdateTime;
      const secondsElapsed = Math.floor(timeSinceLastUpdate / 1000);
      
      // If the session was running, calculate how much time has passed
      if (savedState.isRunning) {
        const adjustedTimeRemaining = Math.max(0, savedState.timeRemaining - secondsElapsed);
        
        setTimeRemaining(adjustedTimeRemaining);
        setIsRunning(adjustedTimeRemaining > 0);
        setWorkDuration(savedState.workDuration);
        
        if (savedState.sessionStartTime) {
          setCurrentSessionStart(new Date(savedState.sessionStartTime));
        }
        
        // If time ran out while away, finish the session
        if (adjustedTimeRemaining <= 0) {
          clearFocusSessionState();
        }
      } else {
        // Session was paused
        setTimeRemaining(savedState.timeRemaining);
        setIsRunning(false);
        setWorkDuration(savedState.workDuration);
        
        if (savedState.sessionStartTime) {
          setCurrentSessionStart(new Date(savedState.sessionStartTime));
        }
      }
    }
  }, [todayIncompleteTasks]);

  // Save session state whenever it changes
  useEffect(() => {
    if (currentTask && (isRunning || timeRemaining > 0)) {
      const sessionState = {
        timeRemaining,
        isRunning,
        workDuration,
        currentTaskId: currentTask.id,
        sessionStartTime: currentSessionStart?.toISOString(),
        lastUpdateTime: Date.now()
      };
      
      saveFocusSessionState(sessionState);
    }
  }, [timeRemaining, isRunning, workDuration, currentTask, currentSessionStart]);

  // Finish session callback
  const finishSession = useCallback(() => {
    if (!currentTask || !currentSessionStart) {
      return;
    }

    const sessionEnd = new Date();
    const actualDuration = Math.round((sessionEnd.getTime() - currentSessionStart.getTime()) / (1000 * 60));
    
    const newSession: FocusSession = {
      id: `${currentTask.id}-${Date.now()}`,
      taskName: currentTask.name,
      taskId: currentTask.id,
      startTime: currentSessionStart,
      endTime: sessionEnd,
      duration: actualDuration,
      completed: true
    };
    
    const updatedHistory = [...focusHistory, newSession];
    setFocusHistory(updatedHistory);
    saveFocusHistory(updatedHistory);
    
    // Reset session state
    setIsRunning(false);
    setTimeRemaining(0);
    setCurrentSessionStart(null);
    clearFocusSessionState();
  }, [currentTask, currentSessionStart, focusHistory]);

  // Timer effect
  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        
        if (newTime <= 0) {
          finishSession();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isRunning, timeRemaining, finishSession]);

  const startSession = () => {
    setTimeRemaining(workDuration * 60);
    setIsRunning(true);
    setCurrentSessionStart(new Date());
  };

  const pauseSession = () => {
    setIsRunning(false);
  };
  
  const resumeSession = () => {
    setIsRunning(true);
  };
  
  const stopSession = () => {
    setIsRunning(false);
    setTimeRemaining(0);
    setCurrentSessionStart(null);
    clearFocusSessionState();
  };

  const selectTask = (task: Task) => {
    setCurrentTaskId(task.id);
    
    // If there's an active session, stop it first
    if (isRunning || timeRemaining > 0) {
      stopSession();
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (hours: number) => {
    const mins = hours * 60;
    return `${mins}m`;
  };

  // Get today's focus sessions
  const todaysSessions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const sessions = focusHistory.filter(session => 
      session.startTime >= today && session.startTime < tomorrow
    );
    
    return sessions;
  }, [focusHistory]);

  const todaysFocusTime = todaysSessions.reduce((total, session) => total + session.duration, 0);

  return (
    <div className="min-h-screen p-6 bg-background flex items-center justify-center">
      <div className="w-full max-w-4xl">
        {/* Main Focus Card */}
        <Card className="mb-8 relative">
          <CardContent className="p-12">
            {currentTask ? (
              <div className="text-center">
                {/* Task Actions - Corner Buttons */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-muted-foreground hover:text-foreground"
                        title="Focus Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Focus Settings</DialogTitle>
                      </DialogHeader>
                      <div className="pt-4">
                        <label className="block text-sm font-medium mb-3">Session Duration (minutes)</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[15, 25, 45, 60].map(duration => (
                             <Button
                               key={duration}
                               variant={workDuration === duration ? "default" : "outline"}
                               size="sm"
                               onClick={() => setWorkDuration(duration)}
                               className="text-xs"
                             >
                               {duration}m
                             </Button>
                          ))}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                       <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-muted-foreground hover:text-foreground"
                          title="View History"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                           <DialogTitle>Today's Focus History</DialogTitle>
                        </DialogHeader>
                        <div className="pt-4">
                          <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
                            <span className="text-sm font-medium">Total Focus Time</span>
                            <span className="text-lg font-bold text-primary">
                              {Math.floor(todaysFocusTime / 60)}h {todaysFocusTime % 60}m
                            </span>
                          </div>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {todaysSessions.length > 0 ? (
                              todaysSessions.slice().reverse().map((session) => (
                                <div key={session.id} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                                  <span className="text-muted-foreground truncate flex-1 mr-2">
                                    {session.taskName}
                                  </span>
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <span className="font-medium">{session.duration}m</span>
                                    <span className="text-xs">
                                      {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-muted-foreground text-sm">
                                No focus sessions completed today.
                              </div>
                            )}
                          </div>
                        </div>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openViewNotesModal(currentTask);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                    title="View Notes"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openEditModal(currentTask, { isFromPool: false });
                    }}
                    className="text-muted-foreground hover:text-foreground"
                    title="Edit Task"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Task Name - Most Prominent */}
                <div className="mb-8">
                  <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
                    {currentTask.name}
                  </h1>
                  
                  {/* Minimal task details */}
                  <div className="flex items-center justify-center gap-4 text-muted-foreground">
                    {currentTask.startHour !== undefined && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> 
                        {formatTime(currentTask.startHour)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Timer className="w-4 h-4" /> 
                      {currentTask.duration}h
                    </span>
                  </div>
                </div>
                
                {/* Timer Controls and Progress */}
                <div className="mb-8">
                  {/* Progress Bar */}
                  {(isRunning || timeRemaining > 0) && (
                    <div className="mb-6">
                      <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-1000 ease-linear"
                          style={{ 
                            width: `${((workDuration * 60 - timeRemaining) / (workDuration * 60)) * 100}%` 
                          }}
                        />
                      </div>
                      <div className="text-center mt-2 text-sm text-muted-foreground">
                        {Math.round(((workDuration * 60 - timeRemaining) / (workDuration * 60)) * 100)}% complete
                      </div>
                    </div>
                  )}
                  
                  {/* Timer Controls */}
                  <div className="flex items-center justify-center gap-4">
                    {!isRunning && timeRemaining === 0 && (
                      <Button 
                        onClick={startSession}
                        size="lg"
                        className="px-8 py-4 text-lg"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Start Focus ({workDuration}m)
                      </Button>
                    )}
                    
                    {!isRunning && timeRemaining > 0 && (
                      <Button 
                        onClick={resumeSession}
                        size="lg"
                        className="px-8 py-4 text-lg"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Resume ({formatTimeRemaining(timeRemaining)})
                      </Button>
                    )}
                    
                    {isRunning && (
                      <Button 
                        onClick={pauseSession}
                        size="lg"
                        variant="secondary"
                        className="px-8 py-4 text-lg"
                      >
                        <Pause className="w-5 h-5 mr-2" />
                        Pause ({formatTimeRemaining(timeRemaining)})
                      </Button>
                    )}
                    
                    {(isRunning || timeRemaining > 0) && (
                      <Button 
                        onClick={stopSession}
                        size="lg"
                        variant="destructive"
                        className="px-8 py-4 text-lg"
                      >
                        <Square className="w-5 h-5 mr-2" />
                        Stop
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Task Completion */}
                <div className="flex items-center justify-center">
                  <Button
                    onClick={() => {
                      handleTaskCompletionToggle(currentTask.id);
                    }}
                    variant="outline"
                    className="flex items-center gap-2 text-lg px-6 py-3"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Mark Complete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-3xl font-bold mb-4">No Tasks Available</h2>
                <p className="text-muted-foreground text-lg">
                  Add some tasks to your daily planner to start focusing!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Task Section - Clean and Minimal */}
        {nextTask && (
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">Next Task</h3>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openViewNotesModal(nextTask);
                  }}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title="View Notes"
                >
                  <Eye className="w-3 h-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openEditModal(nextTask, { isFromPool: false });
                  }}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title="Edit Task"
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">{nextTask.name}</h4>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(nextTask.startHour)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{formatDuration(nextTask.duration)}</span>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
} 