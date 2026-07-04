import {
  applyClassCopyPlan,
  buildClassCopyMutations,
  convertClassTaskToTask,
  detectClassCopyConflicts,
  getClassTasksForDateKey,
  mergeClassCopyIntoTasks,
  prepareClassCopy,
} from './classScheduleUtils';
import { ClassScheduleTask, Task } from '@/types/planner';

const makeClass = (overrides: Partial<ClassScheduleTask> = {}): ClassScheduleTask => ({
  id: 'class-1',
  name: 'Math 101',
  startHour: 9,
  duration: 1,
  color: 'bg-blue-500',
  notes: 'Room 201',
  completed: false,
  dayOfWeek: 1,
  ...overrides,
});

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  name: 'Existing task',
  startHour: 9,
  duration: 1,
  color: 'bg-red-500',
  baseDate: '2026-07-07',
  notes: '',
  completed: false,
  ...overrides,
});

describe('classScheduleUtils', () => {
  let idCounter = 0;
  const generateId = () => `new-${++idCounter}`;

  beforeEach(() => {
    idCounter = 0;
  });

  it('converts a class task to a planner task for a target date', () => {
    const converted = convertClassTaskToTask(makeClass(), '2026-07-07', generateId);

    expect(converted.id).toBe('new-1');
    expect(converted.baseDate).toBe('2026-07-07');
    expect(converted.name).toBe('Math 101');
    expect(converted.completed).toBe(false);
    expect(converted.startHour).toBe(9);
  });

  it('filters classes by weekday from a date key', () => {
    const classes = [
      makeClass({ id: 'mon', dayOfWeek: 1 }),
      makeClass({ id: 'tue', dayOfWeek: 2 }),
    ];

    expect(getClassTasksForDateKey(classes, '2026-07-07')).toEqual([classes[0]]);
  });

  it('detects overlapping tasks', () => {
    const classTask = makeClass();
    const converted = convertClassTaskToTask(classTask, '2026-07-07', generateId);
    const existing = makeTask({ startHour: 9.5, duration: 1 });

    const conflicts = detectClassCopyConflicts([classTask], [converted], [existing]);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].plannerTask.id).toBe('task-1');
  });

  it('prepares a ready plan when there are no conflicts', () => {
    const plan = prepareClassCopy([makeClass()], [], '2026-07-07', generateId);

    expect(plan.status).toBe('ready');
    expect(plan.tasksToAdd).toHaveLength(1);
    expect(plan.conflicts).toHaveLength(0);
  });

  it('prepares a needs_resolution plan for partial conflicts', () => {
    const classes = [
      makeClass({ id: 'class-a', startHour: 9 }),
      makeClass({ id: 'class-b', startHour: 14, name: 'History' }),
    ];
    const existing = [makeTask({ id: 'existing', startHour: 9, duration: 1 })];

    const plan = prepareClassCopy(classes, existing, '2026-07-07', generateId);

    expect(plan.status).toBe('needs_resolution');
    expect(plan.conflicts.length).toBeGreaterThan(0);
    expect(plan.tasksToAdd).toHaveLength(1);
    expect(plan.tasksToAdd[0].name).toBe('History');
  });

  it('applies skip strategy without removing existing tasks', () => {
    const existing = [makeTask({ id: 'existing', startHour: 9, duration: 1 })];
    const plan = prepareClassCopy([makeClass()], existing, '2026-07-07', generateId);

    const { nextTasks, result } = mergeClassCopyIntoTasks(existing, plan, 'skip');

    expect(result.status).toBe('success');
    expect(result.addedCount).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(nextTasks).toHaveLength(1);
    expect(nextTasks[0].id).toBe('existing');
  });

  it('applies replace strategy and removes conflicting tasks', () => {
    const existing = [makeTask({ id: 'existing', startHour: 9, duration: 1 })];
    const plan = prepareClassCopy([makeClass()], existing, '2026-07-07', generateId);

    const { nextTasks, result } = mergeClassCopyIntoTasks(existing, plan, 'replace');

    expect(result.status).toBe('success');
    expect(result.addedCount).toBe(1);
    expect(result.replacedCount).toBe(1);
    expect(nextTasks).toHaveLength(1);
    expect(nextTasks[0].name).toBe('Math 101');
  });

  it('returns empty result when no classes exist for the day', () => {
    const result = applyClassCopyPlan(
      prepareClassCopy([], [], '2026-07-07', generateId),
      'copy_all'
    );

    expect(result.status).toBe('empty');
  });

  it('builds copy_all mutations for conflict-free imports', () => {
    const plan = prepareClassCopy([makeClass()], [], '2026-07-07', generateId);
    const mutations = buildClassCopyMutations(plan, 'copy_all');

    expect(mutations.tasksToAdd).toHaveLength(1);
    expect(mutations.taskIdsToRemove).toHaveLength(0);
  });
});
