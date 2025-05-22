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