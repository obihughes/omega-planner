'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Document, DocumentEditorProps } from '@/types';
import { Save, X, Trash2, Star, StarOff, Bold, Italic, List, ListOrdered, ChevronDown, ChevronUp, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import CanvasTextEditor from './CanvasTextEditor';

interface ExtendedDocumentEditorProps extends DocumentEditorProps {
  onStar?: () => void;
}

export default function DocumentEditor({
  document,
  onSave,
  onClose,
  onDelete,
  onStar
}: ExtendedDocumentEditorProps) {
  const [content, setContent] = useState(document?.content || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (document) {
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
  }, [hasUnsavedChanges, content]);

  const handleSave = async () => {
    if (!document) return;
    
    setIsAutoSaving(true);
    const updatedDocument: Document = {
      ...document,
      title: document.title,
      content
    };
    
    onSave(updatedDocument);
    setHasUnsavedChanges(false);
    
    setTimeout(() => setIsAutoSaving(false), 1000);
  };

  // Text editing is now handled by CanvasTextEditor

  const formatText = (command: string, value?: string) => {
    // Formatting is handled differently in canvas mode
    console.log('Formatting not available in canvas mode:', command, value);
  };

  const handleBold = () => {
    formatText('bold');
  };

  const handleItalic = () => {
    formatText('italic');
  };

  const handleHeading = (level: number) => {
    formatText('formatBlock', `h${level}`);
  };

  if (!document) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Canvas Text Editor for True Independent Positioning */}
      <div className="flex-1 overflow-hidden bg-background">
        <CanvasTextEditor
          content={content}
          onChange={(newContent: string) => {
            setContent(newContent);
            setHasUnsavedChanges(true);
          }}
          className="h-full px-6 py-8 text-foreground"
          style={{
            direction: 'ltr',
          }}
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
} 