import { ClassScheduleTask, ClassScheduleStorageData } from '@/types/planner';

const STORAGE_KEY = 'omega-planner-class-schedule';
const STORAGE_VERSION = '1.0';

export const ClassScheduleStorage = {
  load(): ClassScheduleTask[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    try {
      const data: ClassScheduleStorageData = JSON.parse(raw);
      if (!data || !Array.isArray(data.tasks)) return [];

      return data.tasks
        .map(ClassScheduleStorage.clean)
        .filter(ClassScheduleStorage.isValid);
    } catch (e) {
      console.error('Failed to load class schedule storage', e);
      return [];
    }
  },

  save(tasks: ClassScheduleTask[]): void {
    if (typeof window === 'undefined') return;
    try {
      const payload: ClassScheduleStorageData = {
        version: STORAGE_VERSION,
        tasks: tasks.map(ClassScheduleStorage.clean),
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save class schedule storage', e);
    }
  },

  isValid(task: any): task is ClassScheduleTask {
    return (
      task &&
      typeof task.id === 'string' &&
      typeof task.name === 'string' &&
      typeof task.duration === 'number' &&
      typeof task.color === 'string' &&
      typeof task.dayOfWeek === 'number'
    );
  },

  clean(task: any): ClassScheduleTask {
    const now = new Date().toISOString();
    const rawDayOfWeek =
      typeof task.dayOfWeek === 'number' ? task.dayOfWeek : new Date().getDay();
    const safeDayOfWeek = ((rawDayOfWeek % 7) + 7) % 7;

    return {
      id:
        typeof task.id === 'string' && task.id.trim().length > 0
          ? task.id
          : `class_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: String(task.name ?? '').trim(),
      startHour:
        typeof task.startHour === 'number' ? task.startHour : 9,
      duration:
        typeof task.duration === 'number' && task.duration > 0
          ? task.duration
          : 1,
      color: typeof task.color === 'string' ? task.color : 'bg-blue-500',
      notes: typeof task.notes === 'string' ? task.notes : '',
      completed: !!task.completed,
      dayOfWeek: safeDayOfWeek,
      createdAt:
        typeof task.createdAt === 'string' ? task.createdAt : now,
      updatedAt:
        typeof task.updatedAt === 'string' ? task.updatedAt : now,
    };
  },
};


