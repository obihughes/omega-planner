export function getContrastColor(hexColor: string): '#000' | '#fff' {
  if (!hexColor) return '#000';

  // If a leading # is provided, remove it
  if (hexColor.slice(0, 1) === '#') {
    hexColor = hexColor.slice(1);
  }

  // If a three-character hexcode, expand it
  if (hexColor.length === 3) {
    hexColor = hexColor
      .split('')
      .map((hex) => hex + hex)
      .join('');
  }

  // Convert to RGB
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000' : '#fff';
} 