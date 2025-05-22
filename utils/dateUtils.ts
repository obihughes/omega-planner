/**
 * Helper function to get the actual calendar date for a column offset from the current day.
 * The date is normalized to midnight (00:00:00:000).
 * @param {number} columnDayOffset - The number of days to offset from the current date.
 * @returns {Date} The calculated calendar date, normalized to midnight.
 */
export const getCalendarDateForColumn = (columnDayOffset: number): Date => {
  const date = new Date(); // Today's actual date
  date.setHours(0, 0, 0, 0); // Normalize to start of day
  date.setDate(date.getDate() + columnDayOffset);
  return date;
};

/**
 * Helper function to extract a Date object representing the calendar date (normalized to midnight)
 * from an ISO date string.
 * @param {string} isoDateString - The ISO string representation of a date.
 * @returns {Date} A Date object normalized to midnight of the given ISO string's date.
 */
export const getDateWithoutTime = (isoDateString: string): Date => {
  const date = new Date(isoDateString);
  date.setHours(0, 0, 0, 0);
  return date;
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
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}; 