'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Document, DocumentEditorProps } from '@/types';
import { Save, X, Trash2, Star, StarOff, Bold, Italic, List, ListOrdered, ChevronDown, ChevronUp, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExtendedDocumentEditorProps extends DocumentEditorProps {
  onStar?: () => void;
}

export const DocumentEditor: React.FC<ExtendedDocumentEditorProps> = ({
  document,
  onSave,
  onClose,
  onDelete,
  onStar
}) => {
  const [title, setTitle] = useState(document?.title || '');
  const [content, setContent] = useState(document?.content || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(document.content);
      setHasUnsavedChanges(false);
    }
  }, [document]);

  useEffect(() => {
    // Auto-save after 2 seconds of inactivity
    if (hasUnsavedChanges && document) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave();
      }, 2000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, title, content]);

  const handleSave = async () => {
    if (!document) return;
    
    setIsAutoSaving(true);
    const updatedDocument: Document = {
      ...document,
      title: title.trim() || 'Untitled Document',
      content
    };
    
    onSave(updatedDocument);
    setHasUnsavedChanges(false);
    
    setTimeout(() => setIsAutoSaving(false), 1000);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleContentChange = () => {
    if (contentRef.current) {
      const newContent = contentRef.current.innerHTML;
      setContent(newContent);
      setHasUnsavedChanges(true);
    }
  };

  const formatText = (command: string, value?: string) => {
    if (typeof window !== 'undefined' && window.document) {
      window.document.execCommand(command, false, value);
      contentRef.current?.focus();
      handleContentChange();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Ctrl+S
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  if (!document) return null;

  return (
    <div className="flex flex-col h-full" onKeyDown={handleKeyDown}>
      {/* Minimal Header */}
      <div className="border-b bg-background/95 backdrop-blur">
        {/* Title Row */}
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled Document"
              className="text-lg font-medium bg-transparent border-none outline-none flex-1 focus:ring-0 min-w-0 placeholder:text-muted-foreground/50"
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            {/* Save Status */}
            <div className="flex items-center gap-2 text-xs">
              {isAutoSaving && (
                <span className="text-muted-foreground">Saving...</span>
              )}
              {hasUnsavedChanges && !isAutoSaving && (
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
              )}
            </div>
            
            {/* Star Button */}
            {onStar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onStar}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                title={document.isStarred ? "Remove star" : "Add star"}
              >
                {document.isStarred ? (
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                ) : (
                  <Star className="w-4 h-4" />
                )}
              </Button>
            )}
            
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Minimal Formatting Controls */}
        <div className="px-6 py-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Always visible quick formatting */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('bold')}
                className="h-7 px-2 text-xs font-medium"
                title="Bold (Ctrl+B)"
              >
                <Bold className="w-3.5 h-3.5 mr-1" />
                B
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('italic')}
                className="h-7 px-2 text-xs font-medium"
                title="Italic (Ctrl+I)"
              >
                <Italic className="w-3.5 h-3.5 mr-1" />
                I
              </Button>
              
              <div className="w-px h-4 bg-border mx-1" />
              
              {/* Expandable formatting */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}
                className="h-7 px-2 text-xs"
              >
                <Type className="w-3.5 h-3.5 mr-1" />
                More
                {isToolbarExpanded ? (
                  <ChevronUp className="w-3 h-3 ml-1" />
                ) : (
                  <ChevronDown className="w-3 h-3 ml-1" />
                )}
              </Button>
            </div>
            
            {/* Quick actions */}
            <div className="flex items-center gap-1">
              <Button
                onClick={handleSave}
                size="sm"
                disabled={!hasUnsavedChanges}
                className="h-7 px-3 text-xs"
              >
                Save
              </Button>
            </div>
          </div>
          
          {/* Expanded Toolbar */}
          {isToolbarExpanded && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <div className="flex items-center gap-1 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText('insertUnorderedList')}
                  className="h-7 px-2 text-xs"
                  title="Bullet List"
                >
                  <List className="w-3.5 h-3.5 mr-1" />
                  List
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText('insertOrderedList')}
                  className="h-7 px-2 text-xs"
                  title="Numbered List"
                >
                  <ListOrdered className="w-3.5 h-3.5 mr-1" />
                  Numbers
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText('formatBlock', 'h1')}
                  className="h-7 px-2 text-xs"
                  title="Heading 1"
                >
                  H1
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText('formatBlock', 'h2')}
                  className="h-7 px-2 text-xs"
                  title="Heading 2"
                >
                  H2
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText('formatBlock', 'h3')}
                  className="h-7 px-2 text-xs"
                  title="Heading 3"
                >
                  H3
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText('formatBlock', 'p')}
                  className="h-7 px-2 text-xs"
                  title="Paragraph"
                >
                  Text
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clean Editor Content */}
      <div className="flex-1 overflow-hidden bg-background">
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentChange}
          onPaste={handleContentChange}
          dangerouslySetInnerHTML={{ __html: content }}
          className={cn(
            "h-full px-6 py-8 outline-none overflow-y-auto",
            "focus:ring-0 focus:outline-none",
            "text-foreground leading-relaxed",
            "[&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-8 [&>h1]:first:mt-0",
            "[&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mb-3 [&>h2]:mt-6",
            "[&>h3]:text-lg [&>h3]:font-medium [&>h3]:mb-2 [&>h3]:mt-5",
            "[&>p]:mb-4 [&>p]:leading-relaxed [&>p]:first:mt-0",
            "[&>ul]:mb-4 [&>ul]:pl-6 [&>ul]:space-y-1",
            "[&>ol]:mb-4 [&>ol]:pl-6 [&>ol]:space-y-1",
            "[&>li]:leading-relaxed"
          )}
          style={{ 
            minHeight: '100%',
            fontSize: '16px',
            lineHeight: '1.7',
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            direction: 'ltr',
            textAlign: 'left'
          }}
          dir="ltr"
        />
      </div>

      {/* Minimal Footer */}
      <div className="border-t bg-muted/20 px-6 py-2">
        <div className="flex items-center justify-between text-xs">
          <div className="text-muted-foreground">
            {document.updatedAt && (
              <>Last saved {new Date(document.updatedAt).toLocaleString()}</>
            )}
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm('Delete this document? This cannot be undone.')) {
                  onDelete(document.id);
                }
              }}
              className="text-muted-foreground hover:text-destructive h-6 px-2 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}; 