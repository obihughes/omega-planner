const STORAGE_KEY = 'omega-planner-meals-notes-v1';

export const MEALS_NOTES_STORAGE_KEY = STORAGE_KEY;

export const MealsNotesStorage = {
  load(): string {
    if (typeof window === 'undefined') return '';
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return '';
    try {
      const data = JSON.parse(raw);
      if (data && typeof data === 'object' && typeof data.text === 'string') {
        return data.text;
      }
      if (typeof data === 'string') return data;
      return '';
    } catch {
      return '';
    }
  },

  save(text: string) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          text,
          lastUpdated: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('Failed to save meals notes:', error);
    }
  },
};
