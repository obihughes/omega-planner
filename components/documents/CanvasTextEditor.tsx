import React, { useState, useRef, useEffect } from 'react';
import { Move, Edit, Bold, Italic } from 'lucide-react';

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
  const [recentlyDeleted, setRecentlyDeleted] = useState<TextBlock | null>(null);
  const [showUndoPrompt, setShowUndoPrompt] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const blockElementsRef = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
    // Don't re-initialize if we have an active block being edited
    // This prevents content loss during auto-save
    if (activeBlockId && content === lastPropagatedContent.current) {
      return;
    }
    
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
        isActive: false // Don't restore active state during re-initialization
      }));
      setTextBlocks(snappedBlocks);
      
      // Clear active block during re-initialization to prevent conflicts
      if (!activeBlockId) {
        setActiveBlockId(null);
      }
    }
  }, [content, activeBlockId]);

  const snapToGrid = (x: number, y: number) => ({
    x: Math.round(x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(y / GRID_SIZE) * GRID_SIZE
  });

  const handleContentChange = (newBlocks: TextBlock[]) => {
    // We filter out the 'isActive' property before saving.
    const newContent = JSON.stringify(newBlocks.map(({ isActive, ...rest }) => rest));
    lastPropagatedContent.current = newContent;
    onChange(newContent);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragMode) return;
    const target = e.target as HTMLElement;
    if (target.closest('.group')) {
      return;
    }

    if (activeBlockId) {
      const activeEl = blockElementsRef.current.get(activeBlockId)?.querySelector('[contenteditable]') as HTMLElement;
      let newBlocks = [...textBlocks];
      
      if (activeEl) {
        const newContent = activeEl.innerHTML.trim();
        const block = newBlocks.find(b => b.id === activeBlockId);

        if (block && (newContent === '' || newContent === '<br>')) {
          // If content is empty, remove the block
          newBlocks = newBlocks.filter(b => b.id !== activeBlockId);
        } else if (block && block.content !== newContent) {
          // If content changed, update the block
          newBlocks = newBlocks.map(b =>
            b.id === activeBlockId ? { ...b, content: newContent, isActive: false } : b
          );
        } else {
          // Just deactivate
          newBlocks = newBlocks.map(b =>
            b.id === activeBlockId ? { ...b, isActive: false } : b
          );
        }
      } else {
         // Just deactivate if element not found for some reason
         newBlocks = newBlocks.map(b =>
            b.id === activeBlockId ? { ...b, isActive: false } : b
          );
      }
      
      setTextBlocks(newBlocks);
      handleContentChange(newBlocks);
      setActiveBlockId(null);
    }
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isDragMode) return;

    let currentBlocks = [...textBlocks];
    if (activeBlockId) {
      const activeEl = blockElementsRef.current.get(activeBlockId)?.querySelector('[contenteditable]') as HTMLElement;
      if (activeEl) {
        const newContent = activeEl.innerHTML.trim();
        const block = currentBlocks.find(b => b.id === activeBlockId);

        if (block && (newContent === '' || newContent === '<br>')) {
           currentBlocks = currentBlocks.filter(b => b.id !== activeBlockId);
        } else if (block && block.content !== newContent) {
           currentBlocks = currentBlocks.map(b =>
            b.id === activeBlockId ? { ...b, content: newContent, isActive: false } : b
          );
        } else {
           currentBlocks = currentBlocks.map(b =>
            b.id === activeBlockId ? { ...b, isActive: false } : b
          );
        }
      } else {
         currentBlocks = currentBlocks.map(b =>
            b.id === activeBlockId ? { ...b, isActive: false } : b
        );
      }
      setActiveBlockId(null);
    }

    const canvasRect = canvasRef.current!.getBoundingClientRect();
    const newBlock: TextBlock = {
      id: `block-${Date.now()}`,
      x: e.clientX - canvasRect.left,
      y: e.clientY - canvasRect.top,
      content: '', // Start with empty content
      isActive: true,
    };

    const updatedBlocks = [...currentBlocks, newBlock];
    setTextBlocks(updatedBlocks);
    // Don't save to parent immediately - wait until user types something
    setActiveBlockId(newBlock.id);

    // After creating a new block, focus it so the user can type immediately.
    setTimeout(() => {
        const newBlockEl = blockElementsRef.current.get(newBlock.id)?.querySelector('[contenteditable]');
        if (newBlockEl && newBlockEl instanceof HTMLElement) {
            newBlockEl.focus();
            // No need to select all text if the block is empty
        }
    }, 100);
  };

  const handleBlockChange = (blockId: string, newContent: string) => {
    // This function now only updates the local state immediately for a responsive UI.
    // The debounced propagation to the parent is handled separately.
    const updatedBlocks = textBlocks.map(block =>
      block.id === blockId ? { ...block, content: newContent } : block
    );
    setTextBlocks(updatedBlocks);

    // Debounce the final state propagation to the parent component.
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      // Filter out empty blocks before saving
      const nonEmptyBlocks = updatedBlocks.filter(block => {
        const content = block.content.trim();
        return content !== '' && content !== '<br>';
      });
      handleContentChange(nonEmptyBlocks);
    }, 300); // Reduced debounce time so first keystroke saves quicker
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!activeBlockId) return;

    const activeBlock = textBlocks.find(block => block.id === activeBlockId);

    if (e.key === 'Escape') {
      // Check if current block is empty and remove it
      if (activeBlockId) {
        const activeEl = blockElementsRef.current.get(activeBlockId)?.querySelector('[contenteditable]') as HTMLElement;
        if (activeEl) {
          const content = activeEl.innerHTML.trim();
          if (content === '' || content === '<br>') {
            const filteredBlocks = textBlocks.filter(b => b.id !== activeBlockId);
            setTextBlocks(filteredBlocks);
            handleContentChange(filteredBlocks);
            setActiveBlockId(null);
            return;
          }
        }
      }
      
      setActiveBlockId(null);
      setTextBlocks(blocks => 
        blocks.map(block => ({ ...block, isActive: false }))
      );
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      // Insert 4 non-breaking spaces for a standard tab
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
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

  const handleFormat = (command: string) => {
    const activeEl = activeBlockId ? blockElementsRef.current.get(activeBlockId)?.querySelector('[contenteditable]') : null;
    if (activeEl && activeEl instanceof HTMLElement) {
      activeEl.focus();
      document.execCommand(command, false);
      // After formatting, re-capture the content
      const newContent = activeEl.innerHTML;
      handleBlockChange(activeBlockId!, newContent);
    }
  };

  const handleUndo = () => {
    if (recentlyDeleted) {
      const newBlocks = [...textBlocks, recentlyDeleted];
      setTextBlocks(newBlocks);
      handleContentChange(newBlocks);
      setActiveBlockId(recentlyDeleted.id);
      setRecentlyDeleted(null);
      setShowUndoPrompt(false);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={className} style={style}>
      {/* Floating Formatting Toolbar */}
      {activeBlockId && !isDragMode && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-muted rounded-lg shadow-lg p-1 flex items-center gap-1">
          <button onClick={() => handleFormat('bold')} className="p-2 rounded hover:bg-background/50"><Bold size={16} /></button>
          <button onClick={() => handleFormat('italic')} className="p-2 rounded hover:bg-background/50"><Italic size={16} /></button>
        </div>
      )}

      {/* Undo Prompt */}
      {showUndoPrompt && (
        <div className="absolute top-2 left-2 z-20 bg-yellow-100 border border-yellow-300 rounded-lg shadow-lg p-3 flex items-center gap-2 animate-in slide-in-from-left-5">
          <span className="text-sm text-yellow-800">Text block deleted</span>
          <button 
            onClick={handleUndo}
            className="px-2 py-1 text-xs bg-yellow-200 hover:bg-yellow-300 text-yellow-900 rounded"
          >
            Undo
          </button>
          <button 
            onClick={() => {setShowUndoPrompt(false); setRecentlyDeleted(null);}}
            className="text-yellow-600 hover:text-yellow-800"
          >
            ✕
          </button>
        </div>
      )}

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
              if (isDragging || isDragMode) return;

              // If there's a previously active block, save its content first.
              if (activeBlockId && activeBlockId !== block.id) {
                const activeEl = blockElementsRef.current.get(activeBlockId)?.querySelector('[contenteditable]') as HTMLElement;
                if (activeEl) {
                  const newContent = activeEl.innerHTML.trim();
                  
                  // Check if the previous block is empty and remove it if so
                  if (newContent === '' || newContent === '<br>') {
                    // Remove the empty block instead of saving it
                    const filteredBlocks = textBlocks.filter(b => b.id !== activeBlockId);
                    setTextBlocks(filteredBlocks);
                    handleContentChange(filteredBlocks);
                  } else {
                    // Only save if content is not empty
                    const currentBlock = textBlocks.find(b => b.id === activeBlockId);
                    if (currentBlock && currentBlock.content !== newContent) {
                      // Directly update the blocks array without triggering a full state update yet
                      const blockToUpdate = textBlocks.find(b => b.id === activeBlockId);
                      if(blockToUpdate) blockToUpdate.content = newContent;
                    }
                  }
                }
              }

              // Now, activate the new block
              setActiveBlockId(block.id);
              const updatedBlocks = textBlocks.map(b => ({
                ...b,
                isActive: b.id === block.id,
              }));
              setTextBlocks(updatedBlocks);
              
              // Set cursor position after a delay
              const currentTarget = e.currentTarget;
              const clientX = e.clientX;
              const clientY = e.clientY;
              setTimeout(() => {
                const contentDiv = currentTarget.querySelector('[contenteditable]') as HTMLElement;
                if (contentDiv) {
                  contentDiv.focus();
                  try {
                    if (hasCaretPositionFromPoint(document)) {
                      const caretPos = document.caretPositionFromPoint(clientX, clientY);
                      if (caretPos) {
                        const range = document.createRange();
                        range.setStart(caretPos.offsetNode, caretPos.offset);
                        range.collapse(true);
                        const sel = window.getSelection();
                        if (sel) {
                          sel.removeAllRanges();
                          sel.addRange(range);
                        }
                      }
                    } else if (hasCaretRangeFromPoint(document)) {
                      const range = document.caretRangeFromPoint(clientX, clientY);
                      if (range) {
                        const sel = window.getSelection();
                        if (sel) {
                          sel.removeAllRanges();
                          sel.addRange(range);
                        }
                      }
                    }
                  } catch (error) {
                    console.warn('Cursor positioning failed', error);
                  }
                }
              }, 50);
            }}
          >
            {/* Editable content */}
            <div
              ref={(el: HTMLDivElement | null) => {
                if (el) {
                  blockElementsRef.current.set(block.id, el);
                  if (block.isActive && el.innerHTML !== block.content) {
                    el.innerHTML = block.content;
                  }
                }
              }}
              contentEditable={block.isActive}
              suppressContentEditableWarning={true}
              onInput={(e) => {
                 // This is the most reliable way to handle content changes
                 const newContent = e.currentTarget.innerHTML;
                 handleBlockChange(block.id, newContent);
              }}
              onKeyDown={handleKeyDown}
              className={`outline-none ${block.isActive ? 'cursor-text' : ''}`}
              style={{
                minWidth: block.isActive ? '100px' : 'auto',
                minHeight: '20px'
              }}
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
              <div className="absolute -left-2 top-0 w-1 h-full bg-blue-400 rounded-full" />
            )}
            
            {/* Delete button - only visible in drag mode */}
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
          </div>
        ))}

        {/* Mode Toggle Button - Moved to bottom right */}
        <div className="absolute bottom-4 right-4 z-10">
            <button
              onClick={() => setIsDragMode(!isDragMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all shadow-lg ${
                isDragMode 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              title={isDragMode ? 'Switch to Edit Mode' : 'Switch to Drag Mode'}
            >
              {isDragMode ? <Edit size={16} /> : <Move size={16} />}
              <span>{isDragMode ? 'Editing' : 'Dragging'}</span>
            </button>
        </div>

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