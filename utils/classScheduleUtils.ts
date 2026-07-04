import {
  ApplyClassCopyResult,
  ClassCopyConflictStrategy,
  ClassScheduleConflict,
  ClassScheduleTask,
  PrepareClassCopyResult,
  Task,
} from '@/types/planner';
import { dateFromDateKey } from '@/utils/dateUtils';
import { checkOverlap } from '@/utils/taskUtils';

type GenerateId = () => string;

/**
 * Convert a recurring class schedule entry into a date-specific planner task.
 */
export function convertClassTaskToTask(
  classTask: ClassScheduleTask,
  targetDateKey: string,
  generateId: GenerateId
): Task {
  const nowIso = new Date().toISOString();

  return {
    id: generateId(),
    name: classTask.name,
    startHour: classTask.startHour,
    duration: classTask.duration,
    color: classTask.color,
    baseDate: targetDateKey,
    notes: classTask.notes,
    completed: false,
    createdAt: nowIso,
    poolDate: undefined,
  };
}

/**
 * Filter recurring class tasks for the weekday of a target date key.
 */
export function getClassTasksForDateKey(
  classTasks: ClassScheduleTask[],
  targetDateKey: string
): ClassScheduleTask[] {
  const dayOfWeek = dateFromDateKey(targetDateKey).getDay();
  return classTasks.filter((task) => task.dayOfWeek === dayOfWeek);
}

/**
 * Return scheduled planner tasks for a specific date (startHour required).
 */
export function getScheduledTasksForDate(
  plannerTasks: Task[],
  targetDateKey: string
): Task[] {
  return plannerTasks.filter(
    (task) => task.baseDate === targetDateKey && task.startHour !== undefined
  );
}

/**
 * Detect overlaps between converted class tasks and existing planner tasks.
 */
export function detectClassCopyConflicts(
  classTasks: ClassScheduleTask[],
  convertedTasks: Task[],
  existingTasks: Task[]
): ClassScheduleConflict[] {
  const conflicts: ClassScheduleConflict[] = [];

  classTasks.forEach((classTask, index) => {
    const convertedTask = convertedTasks[index];
    if (!convertedTask) return;
    const convertedStartHour = convertedTask.startHour;
    if (convertedStartHour === undefined) return;

    existingTasks.forEach((plannerTask) => {
      const plannerStartHour = plannerTask.startHour;
      if (plannerStartHour === undefined) return;

      const overlaps = checkOverlap(
        convertedStartHour,
        convertedTask.duration,
        plannerStartHour,
        plannerTask.duration
      );

      if (overlaps) {
        conflicts.push({
          classTask,
          plannerTask,
          convertedTask,
        });
      }
    });
  });

  return conflicts;
}

/**
 * Analyze importing classes for a date without mutating planner state.
 */
export function prepareClassCopy(
  classTasks: ClassScheduleTask[],
  plannerTasks: Task[],
  targetDateKey: string,
  generateId: GenerateId
): PrepareClassCopyResult {
  const classesForDay = getClassTasksForDateKey(classTasks, targetDateKey);

  if (classesForDay.length === 0) {
    return {
      status: 'empty',
      targetDateKey,
      classesForDay: [],
      conflicts: [],
      tasksToAdd: [],
      allConvertedTasks: [],
    };
  }

  const allConvertedTasks = classesForDay.map((classTask) =>
    convertClassTaskToTask(classTask, targetDateKey, generateId)
  );
  const existingScheduledTasks = getScheduledTasksForDate(plannerTasks, targetDateKey);
  const conflicts = detectClassCopyConflicts(
    classesForDay,
    allConvertedTasks,
    existingScheduledTasks
  );

  const conflictingConvertedIds = new Set(
    conflicts.map((conflict) => conflict.convertedTask.id)
  );
  const tasksToAdd = allConvertedTasks.filter(
    (task) => !conflictingConvertedIds.has(task.id)
  );

  if (conflicts.length === 0) {
    return {
      status: 'ready',
      targetDateKey,
      classesForDay,
      conflicts,
      tasksToAdd: allConvertedTasks,
      allConvertedTasks,
    };
  }

  if (tasksToAdd.length === 0) {
    return {
      status: 'all_conflicts',
      targetDateKey,
      classesForDay,
      conflicts,
      tasksToAdd: [],
      allConvertedTasks,
    };
  }

  return {
    status: 'needs_resolution',
    targetDateKey,
    classesForDay,
    conflicts,
    tasksToAdd,
    allConvertedTasks,
  };
}

/**
 * Build the planner mutations needed to apply an import plan.
 */
export function buildClassCopyMutations(
  plan: PrepareClassCopyResult,
  strategy: ClassCopyConflictStrategy | 'copy_all'
): { tasksToAdd: Task[]; taskIdsToRemove: string[] } {
  if (strategy === 'copy_all' || strategy === 'skip') {
    return {
      tasksToAdd: strategy === 'copy_all' ? plan.allConvertedTasks : plan.tasksToAdd,
      taskIdsToRemove: [],
    };
  }

  const conflictingPlannerTaskIds = new Set(
    plan.conflicts.map((conflict) => conflict.plannerTask.id)
  );

  return {
    tasksToAdd: plan.allConvertedTasks,
    taskIdsToRemove: Array.from(conflictingPlannerTaskIds),
  };
}

/**
 * Apply a prepared class import plan and return a summary for UI feedback.
 */
export function applyClassCopyPlan(
  plan: PrepareClassCopyResult,
  strategy: ClassCopyConflictStrategy | 'copy_all' | 'cancel'
): ApplyClassCopyResult {
  if (strategy === 'cancel') {
    return {
      status: 'cancelled',
      addedCount: 0,
      skippedCount: 0,
      replacedCount: 0,
    };
  }

  if (plan.status === 'empty') {
    return {
      status: 'empty',
      addedCount: 0,
      skippedCount: 0,
      replacedCount: 0,
    };
  }

  const { tasksToAdd, taskIdsToRemove } = buildClassCopyMutations(plan, strategy);

  return {
    status: 'success',
    addedCount: tasksToAdd.length,
    skippedCount:
      strategy === 'skip'
        ? plan.allConvertedTasks.length - tasksToAdd.length
        : 0,
    replacedCount: taskIdsToRemove.length,
  };
}

/**
 * Convenience helper that returns the planner task list after applying a copy plan.
 */
export function mergeClassCopyIntoTasks(
  plannerTasks: Task[],
  plan: PrepareClassCopyResult,
  strategy: ClassCopyConflictStrategy | 'copy_all' | 'cancel'
): { nextTasks: Task[]; result: ApplyClassCopyResult } {
  const result = applyClassCopyPlan(plan, strategy);

  if (result.status !== 'success') {
    return { nextTasks: plannerTasks, result };
  }

  const { tasksToAdd, taskIdsToRemove } = buildClassCopyMutations(
    plan,
    strategy === 'cancel' ? 'skip' : strategy
  );
  const removeIds = new Set(taskIdsToRemove);
  const nextTasks = [
    ...plannerTasks.filter((task) => !removeIds.has(task.id)),
    ...tasksToAdd,
  ];

  return { nextTasks, result };
}
