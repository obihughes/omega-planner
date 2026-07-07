import { ClassScheduleTask, ClassScheduleStorageData } from '@/types/planner';

const STORAGE_KEY = 'omega-planner-class-schedule';
const SHOW_DAILY_TASKS_KEY = 'omega-planner-class-schedule-show-daily-tasks';
const STORAGE_VERSION = '1.0';

export const ClassScheduleStorage = {
  load(): ClassScheduleTask[] {
    console.log('🔍 [ClassScheduleStorage] load() called');
    if (typeof window === 'undefined') {
      console.log('⚠️ [ClassScheduleStorage] load() called on server-side, returning empty array');
      return [];
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    console.log('🔍 [ClassScheduleStorage] Raw localStorage value:', raw);

    if (!raw) {
      console.log('ℹ️ [ClassScheduleStorage] No stored class schedule found in localStorage');
      return [];
    }

    try {
      const data: ClassScheduleStorageData = JSON.parse(raw);
      console.log('🔍 [ClassScheduleStorage] Parsed data:', data);

      if (!data || !Array.isArray(data.tasks)) {
        console.log('⚠️ [ClassScheduleStorage] Invalid data structure, returning empty array');
        return [];
      }

      const loaded = data.tasks
        .map(ClassScheduleStorage.clean)
        .filter(ClassScheduleStorage.isValid);
      console.log('✅ [ClassScheduleStorage] Successfully loaded', loaded.length, 'tasks:', loaded);
      return loaded;
    } catch (e) {
      console.error('❌ [ClassScheduleStorage] Failed to load:', e);
      console.error('❌ [ClassScheduleStorage] Raw data that failed to parse:', raw);
      return [];
    }
  },

  save(tasks: ClassScheduleTask[]): void {
    console.log('💾 [ClassScheduleStorage] save() called with', tasks.length, 'tasks:', tasks);
    if (typeof window === 'undefined') {
      console.log('⚠️ [ClassScheduleStorage] save() called on server-side, skipping');
      return;
    }

    try {
      const cleanedTasks = tasks.map(ClassScheduleStorage.clean);
      console.log('🧹 [ClassScheduleStorage] Cleaned tasks:', cleanedTasks);

      const payload: ClassScheduleStorageData = {
        version: STORAGE_VERSION,
        tasks: cleanedTasks,
        lastUpdated: new Date().toISOString(),
      };

      console.log('📦 [ClassScheduleStorage] Payload to save:', payload);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

      // Verify the save worked
      const verifyRaw = localStorage.getItem(STORAGE_KEY);
      if (verifyRaw) {
        const verifyData = JSON.parse(verifyRaw);
        console.log('✅ [ClassScheduleStorage] Save verified, stored', verifyData.tasks.length, 'tasks');
      } else {
        console.error('❌ [ClassScheduleStorage] Save verification failed - could not read back from localStorage');
      }
    } catch (e) {
      console.error('❌ [ClassScheduleStorage] Failed to save:', e);
      console.error('❌ [ClassScheduleStorage] Tasks that failed to save:', tasks);
    }
  },

  isValid(task: any): task is ClassScheduleTask {
    return (
      task &&
      typeof task.id === 'string' &&
      typeof task.name === 'string' &&
      typeof task.startHour === 'number' &&
      typeof task.duration === 'number' &&
      typeof task.color === 'string' &&
      typeof task.dayOfWeek === 'number'
    );
  },

  getShowDailyTasks(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const raw = localStorage.getItem(SHOW_DAILY_TASKS_KEY);
    if (raw === null) {
      return false;
    }

    try {
      return JSON.parse(raw) === true;
    } catch {
      return false;
    }
  },

  setShowDailyTasks(value: boolean): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(SHOW_DAILY_TASKS_KEY, JSON.stringify(value));
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



