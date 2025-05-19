// Create a new file for formatting utilities
export const formatDuration = (duration: number): string => {
  const hours = Math.floor(duration);
  const minutes = Math.round((duration - hours) * 60);
  
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

export const formatTime = (hour: number): string => {
  const hourInt = Math.floor(hour);
  const minutes = Math.round((hour - hourInt) * 60);
  const period = hourInt >= 12 ? 'pm' : 'am';
  const displayHour = hourInt % 12 || 12; // Convert 0 to 12 for 12 AM
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}; 