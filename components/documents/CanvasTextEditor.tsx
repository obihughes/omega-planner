import React, { useState, useRef, useEffect } from 'react';
import { Move, Edit } from 'lucide-react';

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
  const activeTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Snap position to grid
  const snapToGrid = (x: number, y: number) => ({
    x: Math.round(x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(y / GRID_SIZE) * GRID_SIZE
  });

  // Convert content string to text blocks on load
  useEffect(() => {
    if (content && textBlocks.length === 0) {
      // Parse existing content into blocks (simple approach for now)
      const lines = content.split('\n');
      const blocks: TextBlock[] = [];
      
      lines.forEach((line, lineIndex) => {
        if (line.trim()) {
          // For each line with content, create blocks separated by multiple spaces
          const segments = line.split(/\s{5,}/);
          let xOffset = 0;
          
          segments.forEach((segment, segmentIndex) => {
            if (segment.trim()) {
              // Find the actual position in the original line
              const segmentStart = line.indexOf(segment, xOffset);
              const snapped = snapToGrid(segmentStart * CHAR_WIDTH, lineIndex * LINE_HEIGHT);
              blocks.push({
                id: `block-${Date.now()}-${lineIndex}-${segmentIndex}`,
                x: snapped.x,
                y: snapped.y,
                content: segment.trim(),
                isActive: false
              });
              xOffset = segmentStart + segment.length;
            }
          });
        }
      });
      
      if (blocks.length > 0) {
        setTextBlocks(blocks);
      }
    }
  }, [content, textBlocks.length]);

  // Convert text blocks back to content string
  const blocksToContent = (blocks: TextBlock[]): string => {
    if (blocks.length === 0) return '';
    
    // Group blocks by approximate line
    const lineHeight = 27.2;
    const lineGroups: { [key: number]: TextBlock[] } = {};
    
    blocks.forEach(block => {
      const lineNumber = Math.round(block.y / lineHeight);
      if (!lineGroups[lineNumber]) {
        lineGroups[lineNumber] = [];
      }
      lineGroups[lineNumber].push(block);
    });
    
    // Convert back to string
    const maxLine = Math.max(...Object.keys(lineGroups).map(Number));
    const lines: string[] = [];
    
    for (let i = 0; i <= maxLine; i++) {
      if (lineGroups[i]) {
        // Sort blocks by x position
        const sortedBlocks = lineGroups[i].sort((a, b) => a.x - b.x);
        let line = '';
        let lastEndPos = 0;
        
        sortedBlocks.forEach(block => {
          const blockStartChar = Math.round(block.x / 8.4);
          const spacesNeeded = Math.max(0, blockStartChar - lastEndPos);
          line += ' '.repeat(spacesNeeded) + block.content;
          lastEndPos = blockStartChar + block.content.length;
        });
        
        lines[i] = line;
      } else {
        lines[i] = '';
      }
    }
    
    return lines.join('\n');
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Single click only activates existing blocks in edit mode
    if (isDragging || isDragMode) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left - 24; // Subtract padding
    const y = e.clientY - rect.top - 32; // Subtract padding

    // Check if clicking on an existing block
    const clickedBlock = textBlocks.find(block => 
      x >= block.x && 
      x <= block.x + Math.max(20, block.content.length * CHAR_WIDTH) &&
      Math.abs(y - block.y) < LINE_HEIGHT / 2
    );

    if (clickedBlock) {
      // Activate existing block
      setActiveBlockId(clickedBlock.id);
      setTextBlocks(blocks => 
        blocks.map(block => ({
          ...block,
          isActive: block.id === clickedBlock.id
        }))
      );
    } else {
      // Deactivate all blocks when clicking empty space
      setActiveBlockId(null);
      setTextBlocks(blocks => 
        blocks.map(block => ({ ...block, isActive: false }))
      );
    }
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
    
    setTextBlocks(blocks => [
      ...blocks.map(block => ({ ...block, isActive: false })),
      newBlock
    ]);
    setActiveBlockId(newBlock.id);
  };

  const handleBlockChange = (blockId: string, newContent: string) => {
    setTextBlocks(blocks => {
      const updatedBlocks = blocks.map(block =>
        block.id === blockId ? { ...block, content: newContent } : block
      );
      
      // Update the parent content
      onChange(blocksToContent(updatedBlocks));
      return updatedBlocks;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!activeBlockId) return;

    if (e.key === 'Escape') {
      setActiveBlockId(null);
      setTextBlocks(blocks => 
        blocks.map(block => ({ ...block, isActive: false }))
      );
      return;
    }

    // Allow Enter for new lines - don't prevent default
    if (e.key === 'Enter') {
      // Let the textarea handle it naturally
      return;
    }

    if (e.key === 'Delete' && e.ctrlKey) {
      // Ctrl+Delete to delete entire block
      setTextBlocks(blocks => {
        const filtered = blocks.filter(block => block.id !== activeBlockId);
        onChange(blocksToContent(filtered));
        return filtered;
      });
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
      onChange(blocksToContent(updated));
      return updated;
    });
  };

  const handleMouseUp = () => {
    setIsDragging(null);
    setDragOffset({ x: 0, y: 0 });
  };

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
          <div key={block.id}>
            {/* Visible textarea for active block */}
            {block.isActive ? (
              <textarea
                ref={activeTextareaRef}
                value={block.content}
                onChange={(e) => handleBlockChange(block.id, e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  setTimeout(() => {
                    if (document.activeElement !== activeTextareaRef.current) {
                      setActiveBlockId(null);
                      setTextBlocks(blocks => 
                        blocks.map(block => ({ ...block, isActive: false }))
                      );
                    }
                  }, 100);
                }}
                className="absolute border-2 border-blue-400 rounded px-2 py-1 resize-none outline-none"
                style={{
                  left: block.x,
                  top: block.y,
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  lineHeight: 'inherit',
                  background: 'rgba(59, 130, 246, 0.1)',
                  minWidth: '100px',
                  minHeight: '20px',
                  whiteSpace: 'pre-wrap',
                  overflow: 'hidden'
                }}
                autoFocus
                spellCheck={false}
              />
            ) : (
              /* Static text display for inactive blocks */
              <div
                className={`absolute select-none group ${
                  isDragMode 
                    ? 'cursor-grab hover:bg-gray-100 px-1 -mx-1 rounded' 
                    : 'cursor-text hover:bg-gray-50 px-1 -mx-1 rounded'
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
                    setActiveBlockId(block.id);
                    setTextBlocks(blocks => 
                      blocks.map(b => ({ ...b, isActive: b.id === block.id }))
                    );
                  }
                }}
              >
                {block.content || ''}
                {/* Drag handle - only visible in drag mode */}
                {isDragMode && (
                  <div className="absolute -left-1 -top-1 w-2 h-2 bg-blue-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity cursor-grab" />
                )}
              </div>
            )}
          </div>
        ))}



        {/* Instruction text when no blocks exist */}
        {textBlocks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">Double-click anywhere to start typing</p>
              <p className="text-sm">Each double-click creates an independent text block</p>
              <p className="text-xs mt-2">• Toggle drag mode to reposition • Enter for new lines • Ctrl+Del to delete</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasTextEditor; 