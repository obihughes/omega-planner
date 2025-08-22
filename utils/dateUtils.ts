/**
 * Get YYYY-MM-DD string for today + offset days.
 * @param {number} dayOffset - Number of days from today (0 = today, 1 = tomorrow, -1 = yesterday)
 * @returns {string} Date key in YYYY-MM-DD format
 */
export const getDateKeyFromOffset = (dayOffset: number): string => {
  const date = new Date();
  // Set time to noon to avoid timezone-related date shifts
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Convert YYYY-MM-DD string to Date object for display purposes.
 * @param {string} dateKey - Date in YYYY-MM-DD format
 * @returns {Date} Date object set to midnight of that day in local timezone
 */
export const dateFromDateKey = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split('-').map(Number);
  // Set time to noon to avoid timezone-related date shifts
  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

/**
 * Get today's date in YYYY-MM-DD format.
 * @returns {string} Today's date key
 */
export const getTodayDateKey = (): string => {
  return getDateKeyFromOffset(0);
};

/**
 * Add or subtract days from a YYYY-MM-DD date string.
 * @param {string} dateKey - Date in YYYY-MM-DD format
 * @param {number} days - Number of days to add (positive) or subtract (negative)
 * @returns {string} New date key in YYYY-MM-DD format
 */
export const addDaysToDateKey = (dateKey: string, days: number): string => {
  const date = dateFromDateKey(dateKey);
  // dateFromDateKey already sets time to noon, so this is safe
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Generate a consistent date key string in YYYY-MM-DD format from a Date object or ISO string.
 * @param {Date | string} input - The date to generate a key for (Date object or ISO string)
 * @returns {string} Date key in YYYY-MM-DD format
 */
export const getDateKey = (input: Date | string): string => {
  let date: Date;
  
  // Validate input
  if (!input) {
    throw new Error('getDateKey: input cannot be null or undefined');
  }
  
  if (typeof input === 'string') {
    // Handle ISO strings (e.g., "2023-10-27T05:00:00.000Z") correctly
    // by parsing and then using UTC parts to construct a new date
    const d = new Date(input);
    if (isNaN(d.getTime())) {
      throw new Error(`getDateKey: invalid date string "${input}"`);
    }
    date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
  } else if (input instanceof Date) {
    if (isNaN(input.getTime())) {
      throw new Error('getDateKey: invalid Date object');
    }
    date = input;
  } else {
    throw new Error(`getDateKey: expected Date or string, got ${typeof input}`);
  }
  
  // Use UTC methods to avoid timezone shift issues
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Extract date portion from ISO string or Date object, returning a Date object set to midnight.
 * This is for backward compatibility with components expecting this function.
 * @param {string | Date} input - ISO date string or Date object
 * @returns {Date} Date object set to midnight of that day in local timezone
 */
export const getDateWithoutTime = (input: string | Date): Date => {
  let date: Date;
  if (typeof input === 'string') {
    date = new Date(input);
  } else {
    date = input;
  }
  // Use UTC methods to create a date at midnight UTC
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

/**
 * Check if two dates represent the same calendar day.
 * @param {Date | string} date1 - First date (Date object or ISO string)
 * @param {Date | string} date2 - Second date (Date object or ISO string)
 * @returns {boolean} True if both dates are on the same calendar day
 */
export const isSameCalendarDate = (date1: Date | string, date2: Date | string): boolean => {
  const dateKey1 = getDateKey(date1);
  const dateKey2 = getDateKey(date2);
  return dateKey1 === dateKey2;
};

/**
 * Check if a YYYY-MM-DD date key represents today.
 * @param {string} dateKey - Date in YYYY-MM-DD format
 * @returns {boolean} True if the date is today
 */
export const isToday = (dateKey: string): boolean => {
  return dateKey === getTodayDateKey();
};

/**
 * Check if a YYYY-MM-DD date key represents a past date.
 * @param {string} dateKey - Date in YYYY-MM-DD format
 * @returns {boolean} True if the date is in the past
 */
export const isPastDate = (dateKey: string): boolean => {
  return dateKey < getTodayDateKey();
};

/**
 * Helper function to get the actual calendar date for a column offset from the current day.
 * Returns the date key in YYYY-MM-DD format.
 * @param {number} columnDayOffset - The number of days to offset from the current date
 * @returns {string} The calculated date key in YYYY-MM-DD format
 */
export const getCalendarDateForColumn = (columnDayOffset: number): string => {
  return getDateKeyFromOffset(columnDayOffset);
};

/**
 * Format a due date string for display, comparing against today's date.
 * This function properly handles date comparison without time components.
 * @param {string | undefined} dueDate - Due date in YYYY-MM-DD format or ISO string
 * @returns {object | null} Object with text and isOverdue flag, or null if no due date
 */
export const formatDueDate = (dueDate?: string): { text: string; isOverdue: boolean } | null => {
  if (!dueDate) return null;
  
  // Normalize the due date first to handle different formats
  const normalizedDueDate = normalizeDueDate(dueDate);
  if (!normalizedDueDate) return null;
  
  // Get the date key (YYYY-MM-DD format) from the due date
  const dueDateKey = getDateKey(normalizedDueDate);
  const todayKey = getTodayDateKey();
  

  
  // Compare date keys directly (string comparison works for YYYY-MM-DD format)
  if (dueDateKey < todayKey) return { text: '', isOverdue: true }; // Don't show overdue text
  if (dueDateKey === todayKey) return { text: 'Today', isOverdue: false };
  
  // Calculate days difference for future dates
  const dueDate_ = dateFromDateKey(dueDateKey);
  const today = dateFromDateKey(todayKey);
  const diffMs = dueDate_.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return { text: 'Tomorrow', isOverdue: false };
  if (diffDays <= 7) return { text: `${diffDays} days`, isOverdue: false };
  
  // For dates further in the future, show the formatted date
  const date = new Date(dueDate);
  return { text: date.toLocaleDateString(), isOverdue: false };
};

/**
 * Normalize a due date to ensure it's in the correct YYYY-MM-DD format.
 * This function handles various input formats and converts them to date-only strings.
 * @param {string | undefined} dueDate - Due date in any format
 * @returns {string | undefined} Normalized date in YYYY-MM-DD format, or undefined if invalid
 */
export const normalizeDueDate = (dueDate?: string): string | undefined => {
  if (!dueDate) return undefined;
  
  try {
    // If it's already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return dueDate;
    }
    
    // If it's an ISO string or other date format, convert to YYYY-MM-DD
    const date = new Date(dueDate);
    if (isNaN(date.getTime())) {
      console.warn('Invalid due date format:', dueDate);
      return undefined;
    }
    
    // Convert to YYYY-MM-DD format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.warn('Error normalizing due date:', dueDate, error);
    return undefined;
  }
};

 