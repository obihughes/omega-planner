import React, { useState, useRef, useEffect } from 'react';
import { Move, Edit } from 'lucide-react';

// Type guard for caret positioning methods
const hasCaretPositionFromPoint = (doc: Document): doc is Document & { caretPositionFromPoint: (x: number, y: number) => any } => {
  return 'caretPositionFromPoint' in doc;
};

const hasCaretRangeFromPoint = (doc: Document): doc is Document & { caretRangeFromPoint: (x: number, y: number) => Range | null } => {
  return 'caretRangeFromPoint' in doc;
};

interface TextBlock {
  id: string;
  x: number;
  y: number;
  content: string;
  isActive: boolean;
  width?: number;
  height?: number;
}

const GRID_SIZE = 20; // Invisible grid size for snapping
const CHAR_WIDTH = 8.4;
const LINE_HEIGHT = 27.2;

interface CanvasTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

const CanvasTextEditor: React.FC<CanvasTextEditorProps> = ({
  content,
  onChange,
  className,
  style
}) => {
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [isDragMode, setIsDragMode] = useState(false);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const blockElementsRef = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // This ref tracks the last content that was sent to the parent component.
  // It's used to prevent the component from re-initializing itself with old
  // data if the parent component re-renders.
  const lastPropagatedContent = useRef<string | null>(null);

  // This effect is now responsible for synchronizing the internal state with
  // the external `content` prop. It will only re-initialize the blocks if
  // the `content` prop changes to something different than what this component
  // last sent out, which prevents the editor from wiping out the user's
  // current typing.
  useEffect(() => {
    if (content !== lastPropagatedContent.current) {
      let loadedBlocks: TextBlock[] = [];
      if (content) {
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) loadedBlocks = parsed;
        } catch (e) {
          console.warn('Fallback to legacy text parser for backward compatibility.');
          loadedBlocks = content.split('\n').map((line, i) => ({
            id: `block-${Date.now()}-${i}`,
            x: 0,
            y: i * LINE_HEIGHT,
            content: line,
            isActive: false,
          })).filter(block => block.content.trim());
        }
      }
      
      const snappedBlocks = loadedBlocks.map(block => ({
        ...block,
        ...snapToGrid(block.x, block.y),
        isActive: block.id === activeBlockId // Preserve active state on reload
      }));
      setTextBlocks(snappedBlocks);
    }
  }, [content, activeBlockId]);

  const snapToGrid = (x: number, y: number) => ({
    x: Math.round(x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(y / GRID_SIZE) * GRID_SIZE
  });

  const handleContentChange = (newBlocks: TextBlock[]) => {
    const newContent = JSON.stringify(newBlocks, (key, value) => {
      if (key === 'isActive') return undefined; // Don't save `isActive` state
      return value;
    });
    lastPropagatedContent.current = newContent;
    onChange(newContent);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // This handler deactivates blocks when clicking on genuinely empty space.
    // It uses getBoundingClientRect for pixel-perfect hit detection, which solves
    // the bug where clicking on an empty line in a multi-line block would
    // deactivate the editor.
    if (isDragging || isDragMode) return;

    // First, save any pending edits from the currently active block.
    // This solves a race condition where clicking away too quickly could lose data.
    if (activeBlockId) {
      const activeEl = blockElementsRef.current.get(activeBlockId)?.querySelector('[contenteditable]') as HTMLElement;
      if (activeEl) {
        const newContent = activeEl.innerHTML;
        const currentBlock = textBlocks.find(b => b.id === activeBlockId);
        if (currentBlock && currentBlock.content !== newContent) {
          const updatedBlocks = textBlocks.map(b =>
            b.id === activeBlockId ? { ...b, content: newContent } : b
          );
          handleContentChange(updatedBlocks); // This will update parent state
          setTextBlocks(updatedBlocks);     // and then internal state
        }
      }
    }

    const clickX = e.clientX;
    const clickY = e.clientY;

    let wasClickInsideAnyBlock = false;
    for (const element of Array.from(blockElementsRef.current.values())) {
      if (!element) continue;
      const blockRect = element.getBoundingClientRect();
      if (
        clickX >= blockRect.left &&
        clickX <= blockRect.right &&
        clickY >= blockRect.top &&
        clickY <= blockRect.bottom
      ) {
        wasClickInsideAnyBlock = true;
        break;
      }
    }

    if (!wasClickInsideAnyBlock) {
      // Click was on the empty canvas, so deactivate any active block.
      setActiveBlockId(null);
      setTextBlocks(blocks => 
        blocks.map(b => ({ ...b, isActive: false }))
      );
    }
    // If the click was inside a block, its own handler manages activation.
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || isDragMode) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left - 24; // Subtract padding
    const y = e.clientY - rect.top - 32; // Subtract padding

    // Create new block at double-click position (snapped to grid)
    const snapped = snapToGrid(Math.max(0, x), Math.max(0, y));
    const newBlock: TextBlock = {
      id: `block-${Date.now()}`,
      x: snapped.x,
      y: snapped.y,
      content: '',
      isActive: true
    };
    
    const newBlocks = [
      ...textBlocks.map(block => ({ ...block, isActive: false })),
      newBlock
    ];
    setTextBlocks(newBlocks);
    handleContentChange(newBlocks);
    setActiveBlockId(newBlock.id);
  };

  const handleBlockChange = (blockId: string, newContent: string) => {
    const updatedBlocks = textBlocks.map(block =>
      block.id === blockId ? { ...block, content: newContent } : block
    );
    setTextBlocks(updatedBlocks);
    handleContentChange(updatedBlocks);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!activeBlockId) return;

    const activeBlock = textBlocks.find(block => block.id === activeBlockId);

    if (e.key === 'Escape') {
      setActiveBlockId(null);
      setTextBlocks(blocks => 
        blocks.map(block => ({ ...block, isActive: false }))
      );
      return;
    }

    // Handle Enter key to insert <br> tags manually
    if (e.key === 'Enter') {
      e.preventDefault();
      // Using execCommand is deprecated, but it is the most reliable way 
      // to handle line breaks consistently across browsers in a contentEditable div.
      document.execCommand('insertLineBreak');
      return;
    }

    // Delete block with Ctrl+Delete or Delete/Backspace when empty
    if ((e.key === 'Delete' && e.ctrlKey) || 
        ((e.key === 'Delete' || e.key === 'Backspace') && (!activeBlock?.content || activeBlock.content.trim() === ''))) {
      e.preventDefault();
      const filtered = textBlocks.filter(block => block.id !== activeBlockId);
      setTextBlocks(filtered);
      handleContentChange(filtered);
      setActiveBlockId(null);
      return;
    }
  };

  // Mouse handlers for dragging (only in drag mode)
  const handleMouseDown = (e: React.MouseEvent, blockId: string) => {
    if (e.button !== 0 || !isDragMode) return; // Only left click and in drag mode
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const block = textBlocks.find(b => b.id === blockId);
    if (!block) return;

    setIsDragging(blockId);
    setDragOffset({
      x: e.clientX - rect.left - 24 - block.x,
      y: e.clientY - rect.top - 32 - block.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left - 24 - dragOffset.x;
    const y = e.clientY - rect.top - 32 - dragOffset.y;
    
    const snapped = snapToGrid(Math.max(0, x), Math.max(0, y));

    setTextBlocks(blocks => {
      const updated = blocks.map(block =>
        block.id === isDragging 
          ? { ...block, x: snapped.x, y: snapped.y }
          : block
      );
      handleContentChange(updated);
      return updated;
    });
  };

  const handleMouseUp = () => {
    setIsDragging(null);
    setDragOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={className} style={style}>
      {/* Mode Toggle Button */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={() => setIsDragMode(!isDragMode)}
          className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
            isDragMode 
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={isDragMode ? 'Switch to Edit Mode' : 'Switch to Drag Mode'}
        >
          {isDragMode ? <Edit size={16} /> : <Move size={16} />}
          {isDragMode ? 'Edit Mode' : 'Drag Mode'}
        </button>
      </div>

      <div
        ref={canvasRef}
        className="relative w-full h-full cursor-text"
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          minHeight: '100%',
          fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, Courier, monospace',
          fontSize: '16px',
          lineHeight: '1.7',
          backgroundImage: isDragging ? `
            radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)
          ` : 'none',
          backgroundSize: isDragging ? `${GRID_SIZE}px ${GRID_SIZE}px` : 'auto'
        }}
      >
        {/* Render all text blocks */}
        {textBlocks.map((block) => (
          <div
            key={block.id}
            className={`absolute select-none group p-1 ${
              block.isActive 
                ? 'ring-2 ring-blue-500' 
                : isDragMode 
                  ? 'cursor-grab hover:ring-1 hover:ring-gray-300 rounded' 
                  : 'cursor-text hover:ring-1 hover:ring-gray-200 rounded'
            }`}
            style={{
              left: block.x,
              top: block.y,
              fontFamily: 'inherit',
              fontSize: 'inherit',
              lineHeight: 'inherit',
              whiteSpace: 'pre-wrap',
              minWidth: '20px',
              minHeight: '20px'
            }}
            onMouseDown={(e) => handleMouseDown(e, block.id)}
            onClick={(e) => {
              e.stopPropagation();
              if (!isDragging && !isDragMode) {
                // Capture event values before they get nullified
                const currentTarget = e.currentTarget;
                const clientX = e.clientX;
                const clientY = e.clientY;
                
                setActiveBlockId(block.id);
                setTextBlocks(blocks => 
                  blocks.map(b => ({ ...b, isActive: b.id === block.id }))
                );
                
                // Set cursor position to where clicked after React finishes rendering
                setTimeout(() => {
                  const contentDiv = currentTarget.querySelector('[contenteditable]') as HTMLElement;
                  if (contentDiv) {
                    // Ensure content is set first
                    if (contentDiv.textContent !== block.content) {
                      contentDiv.textContent = block.content;
                    }
                    
                    contentDiv.focus();
                    
                    // Use document.caretPositionFromPoint to get precise cursor position
                    if (hasCaretPositionFromPoint(document)) {
                      const caretPos = document.caretPositionFromPoint(clientX, clientY);
                      if (caretPos) {
                        const range = document.createRange();
                        range.setStart(caretPos.offsetNode, caretPos.offset);
                        range.collapse(true);
                        
                        const selection = window.getSelection();
                        if (selection) {
                          selection.removeAllRanges();
                          selection.addRange(range);
                        }
                      }
                    } else if (hasCaretRangeFromPoint(document)) {
                      // Fallback for WebKit browsers
                      const range = document.caretRangeFromPoint(clientX, clientY);
                      if (range) {
                        const selection = window.getSelection();
                        if (selection) {
                          selection.removeAllRanges();
                          selection.addRange(range);
                        }
                      }
                    }
                  }
                }, 50);
              }
            }}
          >
            {/* Editable content */}
            <div
              ref={(el: HTMLDivElement | null) => {
                if (el) {
                  blockElementsRef.current.set(block.id, el);
                  // When a block becomes active, set its content from state using innerHTML
                  if (block.isActive && el.innerHTML !== block.content) {
                    el.innerHTML = block.content;
                  }
                }
              }}
              contentEditable={block.isActive}
              suppressContentEditableWarning={true}
              onKeyDown={handleKeyDown}
              onBlur={(e) => {
                const newContent = e.currentTarget.innerHTML || '';
                handleBlockChange(block.id, newContent);
                
                // Deactivate if focus moves outside the canvas
                if (!e.relatedTarget || !canvasRef.current?.contains(e.relatedTarget as Node)) {
                  setActiveBlockId(null);
                  setTextBlocks(blocks => 
                    blocks.map(b => ({ ...b, isActive: false }))
                  );
                }
              }}
              className={`outline-none ${block.isActive ? 'cursor-text' : ''}`}
              style={{
                minWidth: block.isActive ? '100px' : 'auto',
                minHeight: '20px'
              }}
              // For inactive blocks, render the saved HTML
              dangerouslySetInnerHTML={!block.isActive ? { __html: block.content } : undefined}
            >
              {/* This div's content is managed by the ref and dangerouslySetInnerHTML */}
            </div>
            
            {/* Drag handle - only visible in drag mode */}
            {isDragMode && (
              <div className="absolute -left-1 -top-1 w-2 h-2 bg-blue-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity cursor-grab" />
            )}
            
            {/* Active block indicator */}
            {block.isActive && (
              <>
                <div className="absolute -left-2 top-0 w-1 h-full bg-blue-400 rounded-full" />
                {/* Delete button - only in drag mode */}
                {isDragMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const filtered = textBlocks.filter(b => b.id !== block.id);
                      setTextBlocks(filtered);
                      handleContentChange(filtered);
                      setActiveBlockId(null);
                    }}
                    className="absolute -right-6 -top-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors opacity-70 hover:opacity-100"
                    title="Delete block"
                  >
                    ×
                  </button>
                )}
              </>
            )}
          </div>
        ))}

        {/* Instruction text when no blocks exist */}
        {textBlocks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">Double-click anywhere to start typing</p>
              <p className="text-sm">Each double-click creates an independent text block</p>
              <p className="text-xs mt-2">• Toggle drag mode to reposition and delete • Enter for new lines • Backspace on empty blocks to delete</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasTextEditor; 