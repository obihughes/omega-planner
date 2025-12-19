import { SeriesSegment } from '@/types/projects';

/**
 * Generates an array of values for a single segment based on its configuration
 */
export function getSegmentValues(segment: SeriesSegment): string[] {
  if (segment.type === 'text') {
    return [segment.value || ''];
  }
  
  if (segment.type === 'number') {
    const start = typeof segment.start === 'number' ? segment.start : parseInt(String(segment.start || 1), 10);
    const end = typeof segment.end === 'number' ? segment.end : parseInt(String(segment.end || 1), 10);
    const step = Math.max(1, Math.abs(segment.step || 1)); // Ensure positive step
    
    const values: string[] = [];
    if (start <= end) {
      for (let i = start; i <= end; i += step) {
        values.push(String(i));
      }
    } else {
      for (let i = start; i >= end; i -= step) {
        values.push(String(i));
      }
    }
    return values;
  }
  
  if (segment.type === 'letter') {
    const startChar = String(segment.start || 'A').charAt(0);
    const endChar = String(segment.end || 'A').charAt(0);
    
    const startCode = startChar.charCodeAt(0);
    const endCode = endChar.charCodeAt(0);
    const step = Math.max(1, Math.abs(segment.step || 1));
    
    const values: string[] = [];
    if (startCode <= endCode) {
      for (let i = startCode; i <= endCode; i += step) {
        values.push(String.fromCharCode(i));
      }
    } else {
      for (let i = startCode; i >= endCode; i -= step) {
        values.push(String.fromCharCode(i));
      }
    }
    return values;
  }
  
  return [];
}

/**
 * Generates all possible titles from a list of segments using Cartesian product
 */
export function generateSeriesTitles(segments: SeriesSegment[]): string[] {
  if (!segments || segments.length === 0) return [];

  const segmentOptions = segments.map(getSegmentValues);
  
  // If any segment produces no values (shouldn't happen with defaults, but safety check),
  // then the whole product is empty.
  if (segmentOptions.some(opts => opts.length === 0)) return [];

  const results: string[] = [];
  
  function recursiveGenerate(index: number, current: string) {
    if (index === segmentOptions.length) {
      results.push(current);
      return;
    }
    
    for (const val of segmentOptions[index]) {
      recursiveGenerate(index + 1, current + val);
    }
  }
  
  recursiveGenerate(0, "");
  return results;
}

/**
 * Calculates the total number of items that would be generated
 */
export function calculateSeriesCount(segments: SeriesSegment[]): number {
  if (!segments || segments.length === 0) return 0;
  
  return segments.reduce((acc, segment) => {
    const count = getSegmentValues(segment).length;
    return acc * count;
  }, 1);
}
