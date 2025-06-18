/**
 * Get YYYY-MM-DD string for today + offset days.
 * @param {number} dayOffset - Number of days from today (0 = today, 1 = tomorrow, -1 = yesterday)
 * @returns {string} Date key in YYYY-MM-DD format
 */
export const getDateKeyFromOffset = (dayOffset: number): string => {
  const date = new Date();
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
  return new Date(year, month - 1, day, 0, 0, 0, 0);
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
  if (typeof input === 'string') {
    date = new Date(input);
  } else {
    date = input;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
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
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
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

 