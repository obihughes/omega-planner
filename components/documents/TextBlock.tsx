"use client";

import React, { useRef, useEffect } from 'react';
import { Bold, Italic } from 'lucide-react';
import { TextBlock as TextBlockType } from './types';

interface TextBlockProps {
    block: TextBlockType;
    isDragMode: boolean;
    onMouseDown: (e: React.MouseEvent, blockId: string) => void;
    onDoubleClick: (e: React.MouseEvent, blockId: string) => void;
    onChange: (blockId: string, newContent: string) => void;
    onKeyDown: (e: React.KeyboardEvent, blockId: string) => void;
    onFocus: (blockId: string) => void;
    setBlockRef: (id: string, el: HTMLDivElement | null) => void;
    handleFormat: (command: string) => void;
}

export const TextBlock: React.FC<TextBlockProps> = ({
    block,
    isDragMode,
    onMouseDown,
    onDoubleClick,
    onChange,
    onKeyDown,
    onFocus,
    setBlockRef,
    handleFormat
}) => {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = contentRef.current;
        if (element && element.innerHTML !== block.content) {
            element.innerHTML = block.content;
        }
    }, [block.content]);

    return (
        <div
            ref={el => setBlockRef(block.id, el)}
            className={`group absolute transform-gpu transition-all duration-100 ${block.isActive ? 'z-20' : 'z-10'} ${isDragMode ? 'cursor-move' : ''}`}
            style={{ left: block.x, top: block.y, width: block.width, height: block.height }}
            onMouseDown={(e) => onMouseDown(e, block.id)}
            onDoubleClick={(e) => onDoubleClick(e, block.id)}
        >
            <div
                ref={contentRef}
                contentEditable={!isDragMode}
                suppressContentEditableWarning={true}
                className={`w-full h-full p-2 outline-none focus:ring-2 focus:ring-blue-500 rounded-md transition-all duration-200 ${block.isActive ? 'bg-white bg-opacity-95' : 'bg-transparent'}`}
                onInput={(e) => onChange(block.id, (e.target as HTMLElement).innerHTML)}
                onKeyDown={(e) => onKeyDown(e, block.id)}
                onFocus={() => onFocus(block.id)}
            />
            {block.isActive && (
                <div className="absolute -top-8 left-0 flex items-center space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-md shadow-lg">
                    <button onClick={() => handleFormat('bold')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><Bold size={16} /></button>
                    <button onClick={() => handleFormat('italic')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><Italic size={16} /></button>
                </div>
            )}
        </div>
    );
}; 