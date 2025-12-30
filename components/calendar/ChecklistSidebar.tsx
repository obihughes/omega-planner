'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckSquare2, Square, Plus, Trash2, Edit3, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

interface ChecklistSidebarProps {
  isExpanded?: boolean;
}

const STORAGE_KEY = 'omega-planner-weekly-sidebar';

export function ChecklistSidebar({ isExpanded = true }: ChecklistSidebarProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Load checklist from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedItems = JSON.parse(saved);
        setItems(Array.isArray(parsedItems) ? parsedItems : []);
      }
    } catch (error) {
      console.error('Failed to load weekly checklist:', error);
    }
  }, []);

  // Save checklist to localStorage
  const saveChecklist = (newItems: ChecklistItem[]) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      setItems(newItems);
    } catch (error) {
      console.error('Failed to save weekly checklist:', error);
    }
  };

  const addItem = () => {
    if (!newItemText.trim()) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    saveChecklist([...items, newItem]);
    setNewItemText('');
  };

  const toggleItem = (id: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveChecklist(updatedItems);
  };

  const deleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    saveChecklist(updatedItems);
  };

  const startEditing = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };

  const saveEdit = () => {
    if (!editingText.trim() || !editingId) return;

    const updatedItems = items.map(item =>
      item.id === editingId ? { ...item, text: editingText.trim() } : item
    );
    saveChecklist(updatedItems);
    setEditingId(null);
    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    } else if (e.key === 'Escape') {
      if (editingId) cancelEdit();
    }
  };

  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;

  if (!isExpanded) {
    return (
      <div className="flex flex-col h-full bg-card border-l border-border items-center py-4">
        <div className="text-xs text-muted-foreground font-medium transform -rotate-90 whitespace-nowrap">
          Weekly Notes
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {completedCount}/{totalCount}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h3 className="font-medium text-base mb-4 flex items-center justify-between">
          <span>Weekly Notes</span>
          <span className="text-xs text-muted-foreground font-normal">
            {completedCount}/{totalCount}
          </span>
        </h3>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Add note..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => handleKeyPress(e, addItem)}
            className="flex-1 h-9 text-sm"
          />
          <Button onClick={addItem} size="sm" className="h-9 w-9 p-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            <p>Add notes or tasks for the week</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "group flex items-start gap-3 p-3 rounded-md border transition-all hover:shadow-sm",
                item.completed
                  ? "bg-muted/30 border-border opacity-60"
                  : "bg-background border-border/50 hover:bg-accent/5"
              )}
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110"
              >
                {item.completed ? (
                  <CheckSquare2 className="w-4 h-4 text-primary" />
                ) : (
                  <Square className="w-4 h-4 text-muted-foreground hover:text-primary" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                {editingId === item.id ? (
                  <div className="flex gap-1">
                    <Input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => handleKeyPress(e, saveEdit)}
                      autoFocus
                      className="h-7 text-sm px-1"
                    />
                    <Button size="sm" variant="ghost" onClick={saveEdit} className="h-7 w-7 p-0">
                      <CheckSquare2 className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 w-7 p-0">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        "text-sm break-words leading-relaxed py-1",
                        item.completed && "line-through text-muted-foreground"
                      )}
                      onDoubleClick={() => startEditing(item.id, item.text)}
                    >
                      {item.text}
                    </span>

                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity -mr-1">
                      <Button
                        onClick={() => startEditing(item.id, item.text)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => deleteItem(item.id)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
