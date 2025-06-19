import { Task } from '../types/planner';

/**
 * Checks if two tasks, defined by their start times and durations, overlap.
 * @param {number} task1Start - Start hour of the first task.
 * @param {number} task1Duration - Duration in hours of the first task.
 * @param {number} task2Start - Start hour of the second task.
 * @param {number} task2Duration - Duration in hours of the second task.
 * @returns {boolean} True if the tasks overlap, false otherwise.
 */
export const checkOverlap = (
  task1Start: number, task1Duration: number,
  task2Start: number, task2Duration: number
): boolean => {
  const task1End = task1Start + task1Duration;
  const task2End = task2Start + task2Duration;
  // Tasks overlap if one starts before the other ends, AND one ends after the other starts.
  return task1Start < task2End && task1End > task2Start;
};

export interface CollisionResolutionResizeResult {
  collided: boolean;
  startHour: number;
  duration: number;
}

/**
 * Resolves collisions for a task being resized.
 * @param taskToResizeDetails - The original state of the task being resized.
 * @param proposedStartHour - The proposed new start hour for the task.
 * @param proposedDuration - The proposed new duration for the task.
 * @param allTasks - A list of all tasks to check against for collisions.
 * @param edgeBeingResized - Which edge ('start' or 'end') is being manipulated.
 * @returns {CollisionResolutionResizeResult} An object indicating if a collision occurred and the resolved startHour and duration.
 */
export const resolveCollisionsForResize = (
  taskToResizeDetails: { id: string; baseDate: string; initialStartHour: number; initialDuration: number },
  proposedStartHour: number,
  proposedDuration: number,
  allTasks: Task[],
  edgeBeingResized: 'start' | 'end'
): CollisionResolutionResizeResult => {
  let resolvedStartHour = proposedStartHour;
  let resolvedDuration = proposedDuration;
  let collided = false;

  // Filter tasks on the same day using simple string comparison
  const otherTasksOnSameDay = allTasks.filter(t => {
    if (t.id === taskToResizeDetails.id) return false;
    return t.baseDate === taskToResizeDetails.baseDate;
  });

  if (edgeBeingResized === 'start') {
    let maxEndTimeOfCollidingTasks = -Infinity;
    for (const otherTask of otherTasksOnSameDay) {
      if (checkOverlap(resolvedStartHour, resolvedDuration, otherTask.startHour, otherTask.duration)) {
        collided = true;
        if (resolvedStartHour < (otherTask.startHour + otherTask.duration)) {
          maxEndTimeOfCollidingTasks = Math.max(maxEndTimeOfCollidingTasks, otherTask.startHour + otherTask.duration);
        }
      }
    }
    if (maxEndTimeOfCollidingTasks > -Infinity && resolvedStartHour < maxEndTimeOfCollidingTasks) {
      resolvedStartHour = maxEndTimeOfCollidingTasks;
      resolvedDuration = (taskToResizeDetails.initialStartHour + taskToResizeDetails.initialDuration) - resolvedStartHour;
    }
  } else { // edgeBeingResized === 'end'
    let minStartTimeOfCollidingTasks = Infinity;
    for (const otherTask of otherTasksOnSameDay) {
      if (checkOverlap(resolvedStartHour, resolvedDuration, otherTask.startHour, otherTask.duration)) {
        collided = true;
        if ((resolvedStartHour + resolvedDuration) > otherTask.startHour) {
          minStartTimeOfCollidingTasks = Math.min(minStartTimeOfCollidingTasks, otherTask.startHour);
        }
      }
    }
    if (minStartTimeOfCollidingTasks < Infinity && (resolvedStartHour + resolvedDuration) > minStartTimeOfCollidingTasks) {
      resolvedDuration = minStartTimeOfCollidingTasks - resolvedStartHour;
    }
  }

  return {
    collided,
    startHour: resolvedStartHour,
    duration: resolvedDuration,
  };
};

export interface CollisionResolutionDragResult {
  snappedNewStartHour: number;
  canMove: boolean;
}

/**
 * Resolves collisions for a task being dragged to a new position.
 * @param draggedTaskDetails - Essential details of the task being dragged.
 * @param proposedStartHour - The proposed new start hour for the dragged task.
 * @param targetDateKey - The target date in YYYY-MM-DD format.
 * @param allTasks - An array of all tasks.
 * @param timelineStartHour - The earliest hour in the timeline.
 * @param timelineEndHour - The latest hour in the timeline.
 * @returns {CollisionResolutionDragResult} An object with the resolved start hour and a boolean indicating if the move is valid.
 */
export const resolveCollisionsForDrag = (
  draggedTaskDetails: { id: string; duration: number; baseDate: string },
  proposedStartHour: number,
  targetDateKey: string,
  allTasks: Task[],
  timelineStartHour: number,
  timelineEndHour: number
): CollisionResolutionDragResult => {
  let snappedNewStartHour = proposedStartHour;
  const taskDuration = draggedTaskDetails.duration;
  let canMove = true;

  // Filter tasks on the target date using simple string comparison
  const otherTasksOnTargetDate = allTasks.filter(t => {
    if (t.id === draggedTaskDetails.id) return false;
    return t.baseDate === targetDateKey;
  });

  for (const otherTask of otherTasksOnTargetDate) {
    const overlaps = checkOverlap(snappedNewStartHour, taskDuration, otherTask.startHour, otherTask.duration);

    if (overlaps) {
      if (snappedNewStartHour < otherTask.startHour) {
        // Task is to the left of the obstacle, try to place it right before the obstacle
        snappedNewStartHour = otherTask.startHour - taskDuration;
      } else {
        // Task is to the right of (or overlapping) the obstacle, try to place it right after
        snappedNewStartHour = otherTask.startHour + otherTask.duration;
      }
      // Re-snap and clamp after adjustment attempt
      snappedNewStartHour = Math.max(timelineStartHour, snappedNewStartHour);
      snappedNewStartHour = Math.min(timelineEndHour - taskDuration, snappedNewStartHour);
      snappedNewStartHour = Math.round(snappedNewStartHour * 4) / 4;

      // Final check if the adjusted position is still overlapping
      // This can happen if the task is squeezed between two others or against timeline boundary
      if (checkOverlap(snappedNewStartHour, taskDuration, otherTask.startHour, otherTask.duration)) {
        canMove = false; // If still overlaps, mark as cannot move for this iteration
      }
      
      // If we adjust due to one task, we might create a new collision with another.
      // For simplicity, the original logic broke after the first collision adjustment.
      // To maintain that, we can break here. Or, for a more robust solution,
      // we might re-iterate or collect all constraints. For now, mirroring original:
      break;
    }
  }

  // Final boundary checks even if no collision, or after collision resolution
  snappedNewStartHour = Math.max(timelineStartHour, snappedNewStartHour);
  snappedNewStartHour = Math.min(timelineEndHour - taskDuration, snappedNewStartHour);
  snappedNewStartHour = Math.round(snappedNewStartHour * 4) / 4; // Ensure snapping after final clamp

  // If after all adjustments, the task cannot fit (e.g. duration > available slot after clamping)
  // this will be caught by canMove still being false, or the start/end hours being nonsensical.
  // The `canMove` flag is crucial here.

  return {
    snappedNewStartHour,
    canMove,
  };
}; 