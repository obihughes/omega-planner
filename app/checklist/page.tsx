'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckSquare2, Square, Plus, Trash2, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

const CHECKLIST_STORAGE_KEY = 'omega-planner-checklist';

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Load checklist from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (saved) {
        const parsedItems = JSON.parse(saved);
        setItems(Array.isArray(parsedItems) ? parsedItems : []);
      }
    } catch (error) {
      console.error('Failed to load checklist:', error);
    }
  }, []);

  // Save checklist to localStorage
  const saveChecklist = (newItems: ChecklistItem[]) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(newItems));
      setItems(newItems);
    } catch (error) {
      console.error('Failed to save checklist:', error);
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
    } else if (e.key === 'Escape' && editingId) {
      cancelEdit();
    }
  };

  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;

  return (
    <AppLayout>
      <div className="h-full p-4">
        <div className="max-w-2xl mx-auto h-full">
          <div className="bg-card rounded-lg shadow-sm border border-border h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-light text-foreground tracking-tight">
                  Checklist
                </h1>
                <div className="text-sm text-muted-foreground">
                  {completedCount} of {totalCount} completed
                </div>
              </div>

              {/* Add new item */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Add a new task..."
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, addItem)}
                  className="flex-1"
                />
                <Button onClick={addItem} size="sm" className="px-3">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Checklist items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckSquare2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                  <p>Add your first task above to get started!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all",
                        item.completed
                          ? "bg-muted/50 border-border opacity-75"
                          : "bg-card border-border hover:bg-accent/20"
                      )}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="flex-shrink-0 transition-transform hover:scale-110"
                      >
                        {item.completed ? (
                          <CheckSquare2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Square className="w-5 h-5 text-muted-foreground hover:text-green-500" />
                        )}
                      </button>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        {editingId === item.id ? (
                          <Input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, saveEdit)}
                            onBlur={saveEdit}
                            className="w-full"
                            autoFocus
                          />
                        ) : (
                          <span
                            className={cn(
                              "block text-sm transition-all",
                              item.completed && "line-through text-muted-foreground"
                            )}
                          >
                            {item.text}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          onClick={() => startEditing(item.id, item.text)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => deleteItem(item.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
