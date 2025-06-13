import React from 'react';

// Text zone interface for managing independent text regions
interface TextZone {
  id: string;
  line: number;
  startColumn: number;
  endColumn: number;
  content: string;
}

// Virtual grid configuration
const GRID_CONFIG = {
  minZoneSpacing: 5, // Minimum spaces between zones
  charWidth: 8.4, // Approximate character width for monospace
  lineHeight: 24, // Line height in pixels
};

// Utility function to convert text with better space handling
export const processTextForEditor = (text: string): string => {
  // Replace multiple spaces with non-breaking spaces to maintain formatting
  return text
    .replace(/\t/g, '    ') // Convert tabs to 4 spaces
    .replace(/ {2,}/g, (match) => {
      // Replace multiple spaces with a mix of regular and non-breaking spaces
      // This helps with click positioning while maintaining visual spacing
      return ' ' + '\u00A0'.repeat(match.length - 1);
    });
};

// Parse content into independent text zones
export const parseContentIntoZones = (content: string): TextZone[] => {
  const lines = content.split('\n');
  const zones: TextZone[] = [];
  let zoneId = 0;

  lines.forEach((line, lineIndex) => {
    if (line.trim().length === 0) return; // Skip empty lines

    // Find text segments separated by 5+ spaces
    const segments = line.split(/\s{5,}/);
    let currentColumn = 0;

    segments.forEach((segment, segmentIndex) => {
      if (segment.trim().length === 0) return;

      // Find where this segment starts in the original line
      const segmentStart = line.indexOf(segment, currentColumn);
      
      if (segmentStart !== -1) {
        zones.push({
          id: `zone-${zoneId++}`,
          line: lineIndex,
          startColumn: segmentStart,
          endColumn: segmentStart + segment.length,
          content: segment
        });
        currentColumn = segmentStart + segment.length;
      }
    });
  });

  return zones;
};

// Convert zones back to content string
export const zonesToContent = (zones: TextZone[], totalLines: number): string => {
  const lines: string[] = Array(totalLines).fill('').map(() => '');

  zones.forEach(zone => {
    if (zone.line < lines.length) {
      const line = lines[zone.line];
      const lineLength = line.length;
      
      // Pad with spaces if needed
      if (lineLength < zone.startColumn) {
        lines[zone.line] = line + ' '.repeat(zone.startColumn - lineLength) + zone.content;
      } else {
        // Replace content at position
        const before = line.substring(0, zone.startColumn);
        const after = line.substring(zone.endColumn);
        lines[zone.line] = before + zone.content + after;
      }
    }
  });

  return lines.join('\n');
};

// Find which zone contains a specific position
export const findZoneAtPosition = (zones: TextZone[], line: number, column: number): TextZone | null => {
  return zones.find(zone => 
    zone.line === line && 
    column >= zone.startColumn && 
    column <= zone.endColumn
  ) || null;
};

// Check if a position is in a "safe" area (5+ spaces from any zone)
export const isPositionSafe = (zones: TextZone[], line: number, column: number): boolean => {
  const zonesOnLine = zones.filter(zone => zone.line === line);
  
  for (const zone of zonesOnLine) {
    const distanceToStart = Math.abs(column - zone.startColumn);
    const distanceToEnd = Math.abs(column - zone.endColumn);
    const minDistance = Math.min(distanceToStart, distanceToEnd);
    
    if (minDistance < GRID_CONFIG.minZoneSpacing) {
      return false;
    }
  }
  
  return true;
};

// Snap position to grid for consistent placement
export const snapToGrid = (line: number, column: number): { line: number; column: number } => {
  // Snap to nearest grid positions (every 4 characters for alignment)
  const snappedColumn = Math.round(column / 4) * 4;
  return {
    line: Math.max(0, line),
    column: Math.max(0, snappedColumn)
  };
};

// Calculate character position from pixel coordinates with grid snapping
export const getGridPositionFromCoordinates = (
  element: HTMLElement,
  clientX: number,
  clientY: number
): { line: number; column: number } => {
  const rect = element.getBoundingClientRect();
  const relativeX = clientX - rect.left;
  const relativeY = clientY - rect.top;

  // Get computed styles to calculate character dimensions
  const computedStyle = window.getComputedStyle(element);
  const fontSize = parseFloat(computedStyle.fontSize);
  const lineHeight = parseFloat(computedStyle.lineHeight) || fontSize * 1.7;
  
  // Calculate character width (approximation for monospace fonts)
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (context) {
    context.font = `${fontSize}px ${computedStyle.fontFamily}`;
    const charWidth = context.measureText('M').width;
    
    // Calculate line and column
    const line = Math.floor((relativeY - parseFloat(computedStyle.paddingTop)) / lineHeight);
    const column = Math.floor((relativeX - parseFloat(computedStyle.paddingLeft)) / charWidth);
    
    // Snap to grid
    return snapToGrid(line, column);
  }
  
  return { line: 0, column: 0 };
};

// Create or update a zone at specific position
export const createOrUpdateZone = (
  zones: TextZone[],
  line: number,
  column: number,
  content: string
): TextZone[] => {
  const existingZone = findZoneAtPosition(zones, line, column);
  
  if (existingZone) {
    // Update existing zone
    return zones.map(zone => 
      zone.id === existingZone.id 
        ? { ...zone, content, endColumn: zone.startColumn + content.length }
        : zone
    );
  } else {
    // Create new zone if position is safe
    if (isPositionSafe(zones, line, column)) {
      const newZone: TextZone = {
        id: `zone-${Date.now()}`,
        line,
        startColumn: column,
        endColumn: column + content.length,
        content
      };
      return [...zones, newZone];
    }
  }
  
  return zones;
};

// Insert text at position with zone management
export const insertTextWithZoneManagement = (
  element: HTMLElement,
  clientX: number,
  clientY: number,
  text: string
): void => {
  const position = getGridPositionFromCoordinates(element, clientX, clientY);
  const currentContent = element.textContent || '';
  const currentZones = parseContentIntoZones(currentContent);
  
  // Check if we're in an existing zone or creating a new one
  const targetZone = findZoneAtPosition(currentZones, position.line, position.column);
  
  if (targetZone) {
    // Insert within existing zone
    const relativePosition = position.column - targetZone.startColumn;
    const newContent = targetZone.content.slice(0, relativePosition) + text + targetZone.content.slice(relativePosition);
    const updatedZones = createOrUpdateZone(currentZones, position.line, targetZone.startColumn, newContent);
    
    // Update element content
    const totalLines = Math.max(position.line + 1, currentContent.split('\n').length);
    element.textContent = zonesToContent(updatedZones, totalLines);
  } else if (isPositionSafe(currentZones, position.line, position.column)) {
    // Create new zone
    const updatedZones = createOrUpdateZone(currentZones, position.line, position.column, text);
    const totalLines = Math.max(position.line + 1, currentContent.split('\n').length);
    element.textContent = zonesToContent(updatedZones, totalLines);
  }
};

// Enhanced click positioning with zone management
export const handleZoneBasedClick = (
  element: HTMLElement,
  clientX: number,
  clientY: number
): void => {
  const position = getGridPositionFromCoordinates(element, clientX, clientY);
  const currentContent = element.textContent || '';
  const zones = parseContentIntoZones(currentContent);
  
  // Find if clicking in an existing zone
  const targetZone = findZoneAtPosition(zones, position.line, position.column);
  
  if (targetZone) {
    // Position cursor within the zone
    const relativeColumn = position.column - targetZone.startColumn;
    positionCursorAtCoordinates(element, position.line, targetZone.startColumn + relativeColumn);
  } else if (isPositionSafe(zones, position.line, position.column)) {
    // Position cursor at safe location for new zone
    positionCursorAtCoordinates(element, position.line, position.column);
  } else {
    // Find nearest safe position
    let nearestColumn = position.column;
    while (!isPositionSafe(zones, position.line, nearestColumn) && nearestColumn < 200) {
      nearestColumn += GRID_CONFIG.minZoneSpacing;
    }
    positionCursorAtCoordinates(element, position.line, nearestColumn);
  }
};

// Get text content as lines array
export const getContentAsLines = (element: HTMLElement): string[] => {
  const content = element.textContent || '';
  return content.split('\n');
};

// Set content from lines array
export const setContentFromLines = (element: HTMLElement, lines: string[]): void => {
  element.textContent = lines.join('\n');
};

// Position cursor at specific line and column coordinates
export const positionCursorAtCoordinates = (
  element: HTMLElement,
  targetLine: number,
  targetColumn: number
): void => {
  if (typeof window === 'undefined') return;

  const lines = getContentAsLines(element);
  
  // Ensure we have enough lines
  while (lines.length <= targetLine) {
    lines.push('');
  }
  
  // Ensure the target line has enough characters (spaces)
  const currentLineLength = lines[targetLine].length;
  if (currentLineLength < targetColumn) {
    // Fill with spaces to reach the target column
    lines[targetLine] = lines[targetLine] + ' '.repeat(targetColumn - currentLineLength);
  }
  
  // Update content
  setContentFromLines(element, lines);
  
  // Calculate the absolute position for cursor placement
  let absolutePosition = 0;
  for (let i = 0; i < targetLine; i++) {
    absolutePosition += lines[i].length + 1; // +1 for newline
  }
  absolutePosition += targetColumn;
  
  // Set cursor position
  const range = window.document.createRange();
  const selection = window.getSelection();
  
  if (!selection) return;
  
  try {
    // Find the text node and position within it
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let currentPosition = 0;
    let targetNode = walker.nextNode();
    
    while (targetNode) {
      const nodeLength = targetNode.textContent?.length || 0;
      
      if (currentPosition + nodeLength >= absolutePosition) {
        // Found the target node
        const offsetInNode = absolutePosition - currentPosition;
        range.setStart(targetNode, Math.min(offsetInNode, nodeLength));
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }
      
      currentPosition += nodeLength;
      targetNode = walker.nextNode();
    }
    
    // If we didn't find a text node, create one
    if (element.childNodes.length === 0) {
      const textNode = window.document.createTextNode(lines.join('\n'));
      element.appendChild(textNode);
      range.setStart(textNode, Math.min(absolutePosition, textNode.textContent?.length || 0));
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  } catch (error) {
    console.warn('Could not position cursor:', error);
  }
};

// Enhanced click positioning for free-form text placement
export const handleFreeFormClick = (
  element: HTMLElement,
  clientX: number,
  clientY: number
): void => {
  handleZoneBasedClick(element, clientX, clientY);
};

// Utility function to get accurate cursor position from click coordinates
export const getCursorPositionFromClick = (
  element: HTMLElement,
  clientX: number,
  clientY: number
): { node: Node; offset: number } | null => {
  if (typeof window === 'undefined') return null;

  // Try modern caretPositionFromPoint first
  if ((window.document as any).caretPositionFromPoint) {
    const caretPos = (window.document as any).caretPositionFromPoint(clientX, clientY);
    if (caretPos) {
      return {
        node: caretPos.offsetNode,
        offset: caretPos.offset
      };
    }
  }

  // Fallback to caretRangeFromPoint
  if ((window.document as any).caretRangeFromPoint) {
    const range = (window.document as any).caretRangeFromPoint(clientX, clientY);
    if (range) {
      return {
        node: range.startContainer,
        offset: range.startOffset
      };
    }
  }

  return null;
};

// Utility function to set cursor position
export const setCursorPosition = (node: Node, offset: number): void => {
  if (typeof window === 'undefined') return;

  const range = window.document.createRange();
  const selection = window.getSelection();
  
  if (!selection) return;

  try {
    range.setStart(node, offset);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  } catch (error) {
    console.warn('Could not set cursor position:', error);
  }
};

// Utility function to insert text while preserving formatting with zone awareness
export const insertTextAtSelection = (text: string): void => {
  if (typeof window === 'undefined') return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  
  // Process the text for better space handling
  const processedText = processTextForEditor(text);
  
  // Delete current selection
  range.deleteContents();
  
  // Insert new text
  const textNode = window.document.createTextNode(processedText);
  range.insertNode(textNode);
  
  // Move cursor to end of inserted text
  range.setStartAfter(textNode);
  range.setEndAfter(textNode);
  selection.removeAllRanges();
  selection.addRange(range);
};

// Utility function to handle smart indentation
export const handleSmartIndent = (element: HTMLElement): void => {
  if (typeof window === 'undefined') return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const startContainer = range.startContainer;
  
  // Find the current line's indentation
  let currentLine = '';
  let node = startContainer;
  let offset = range.startOffset;
  
  // Walk backwards to find line start
  while (node && offset > 0) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const beforeCursor = text.substring(0, offset);
      const lastNewlineIndex = beforeCursor.lastIndexOf('\n');
      
      if (lastNewlineIndex !== -1) {
        currentLine = beforeCursor.substring(lastNewlineIndex + 1);
        break;
      } else {
        currentLine = beforeCursor + currentLine;
        offset = 0;
        if (node.previousSibling) {
          node = node.previousSibling;
        } else {
          break;
        }
      }
    } else {
      if (node.previousSibling) {
        node = node.previousSibling;
      } else {
        break;
      }
      offset = 0;
    }
  }
  
  // Calculate indentation (count leading spaces/tabs)
  const indentMatch = currentLine.match(/^(\s*)/);
  const currentIndent = indentMatch ? indentMatch[1] : '';
  
  // Insert newline with same indentation
  insertTextAtSelection('\n' + currentIndent);
};

// Component for enhanced text area with zone-based management
interface EnhancedTextAreaProps {
  content: string;
  onChange: (content: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const EnhancedTextArea: React.FC<EnhancedTextAreaProps> = ({
  content,
  onChange,
  onKeyDown,
  className,
  style
}) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    
    // Use zone-based positioning for independent text areas
    handleZoneBasedClick(target, e.clientX, e.clientY);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.currentTarget;

    if (e.key === 'Tab') {
      e.preventDefault();
      insertTextAtSelection('    '); // 4 spaces
      onChange(target.textContent || '');
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      handleSmartIndent(target);
      onChange(target.textContent || '');
      return;
    }

    onKeyDown?.(e);
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    onChange(target.textContent || '');
  };

  return (
    <div
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{
        whiteSpace: 'pre-wrap',
        tabSize: 4,
        fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, Courier, monospace',
        minHeight: '100%',
        ...style
      }}
      className={className}
      spellCheck={false}
    >
      {content}
    </div>
  );
}; 