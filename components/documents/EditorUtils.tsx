import React from 'react';

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

// Calculate character position from pixel coordinates
export const getCharacterPositionFromCoordinates = (
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
    const charWidth = context.measureText('M').width; // Use 'M' as reference character
    
    // Calculate line and column
    const line = Math.floor((relativeY - parseFloat(computedStyle.paddingTop)) / lineHeight);
    const column = Math.floor((relativeX - parseFloat(computedStyle.paddingLeft)) / charWidth);
    
    return {
      line: Math.max(0, line),
      column: Math.max(0, column)
    };
  }
  
  return { line: 0, column: 0 };
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
  const position = getCharacterPositionFromCoordinates(element, clientX, clientY);
  positionCursorAtCoordinates(element, position.line, position.column);
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

// Utility function to insert text while preserving formatting
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

// Component for enhanced text area with better space handling
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
    
    // Use free-form positioning for better click-to-type experience
    handleFreeFormClick(target, e.clientX, e.clientY);
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