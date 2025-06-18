/**
 * Helper function to get the actual calendar date for a column offset from the current day.
 * The date is normalized to midnight (00:00:00:000) in local timezone.
 * @param {number} columnDayOffset - The number of days to offset from the current date.
 * @returns {Date} The calculated calendar date, normalized to midnight in local timezone.
 */
export const getCalendarDateForColumn = (columnDayOffset: number): Date => {
  const now = new Date();
  // Use local timezone consistently
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate() + columnDayOffset;
  
  // Create a new Date using local timezone constructor
  return new Date(year, month, day, 0, 0, 0, 0);
};

/**
 * Helper function to extract a Date object representing the calendar date (normalized to midnight)
 * from an ISO date string.
 * @param {string} isoDateString - The ISO string representation of a date.
 * @returns {Date} A Date object normalized to midnight of the given ISO string's date in local timezone.
 */
export const getDateWithoutTime = (isoDateString: string): Date => {
  const date = new Date(isoDateString);
  // Use local timezone consistently - get the calendar date components
  const year = date.getFullYear();
  const month = date.getMonth(); 
  const day = date.getDate();
  
  // Create a new Date using local timezone constructor
  return new Date(year, month, day, 0, 0, 0, 0);
};

/**
 * Helper function to compare two Date objects to see if they fall on the same calendar date,
 * ignoring the time component.
 * @param {Date} date1 - The first date.
 * @param {Date} date2 - The second date.
 * @returns {boolean} True if both dates are on the same calendar day, false otherwise.
 */
export const isSameCalendarDate = (date1: Date, date2: Date): boolean => {
  if (!date1 || !date2) return false; // Add a guard for null or undefined dates
  // Use local timezone consistently
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

/**
 * Helper function to generate a consistent date key string in YYYY-MM-DD format
 * using local timezone.
 * @param {Date} date - The date to generate a key for.
 * @returns {string} Date key in YYYY-MM-DD format.
 */
export const getDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Helper function to generate a consistent date key string from an ISO date string.
 * @param {string} isoDateString - The ISO date string.
 * @returns {string} Date key in YYYY-MM-DD format.
 */
export const getDateKeyFromISOString = (isoDateString: string): string => {
  const date = new Date(isoDateString);
  return getDateKey(date);
}; 