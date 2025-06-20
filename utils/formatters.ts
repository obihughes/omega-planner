// Create a new file for formatting utilities
export const formatDuration = (durationInHours: number): string => {
  if (durationInHours <= 0) return '0m'; // Handle zero or negative duration

  const hours = Math.floor(durationInHours);
  const minutes = Math.round((durationInHours - hours) * 60);

  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
};

export const formatTime = (hour: number): string => {
  const hourInt = Math.floor(hour);
  const minutes = Math.round((hour - hourInt) * 60);

  // Normalize hour to 0-23 range
  const normalizedHour = hourInt % 24;

  const period = normalizedHour >= 12 ? 'pm' : 'am';
  
  let displayHour = normalizedHour % 12;
  if (displayHour === 0) {
    displayHour = 12; // 0 and 12 should be displayed as 12
  }
  
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}; 