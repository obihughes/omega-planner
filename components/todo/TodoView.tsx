'use client';

import React, { useMemo, useState } from 'react';
import { GripVertical, StickyNote } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { TodoItem } from '@/types/todo';
import { useTodo } from '@/hooks/useTodo';
import { cn } from '@/lib/utils';

interface TodoRowProps {
  item: TodoItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  dragHandle?: React.ReactNode;
  setNodeRef?: (node: HTMLLIElement | null) => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
}

function TodoRow({
  item,
  onToggle,
  onRemove,
  onUpdateNotes,
  dragHandle,
  setNodeRef,
  style,
  isDragging,
}: TodoRowProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesValue, setNotesValue] = useState(item.notes);

  const handleToggleNotes = () => {
    if (!notesOpen) setNotesValue(item.notes);
    setNotesOpen((prev) => !prev);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotesValue(e.target.value);
    onUpdateNotes(item.id, e.target.value);
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'group rounded-md px-2 py-1.5 hover:bg-muted/50',
        item.done && 'opacity-60',
        isDragging && 'opacity-50 bg-muted/50 z-10'
      )}
    >
      <div className="flex items-center justify-between gap-2 text-sm">
        {dragHandle ?? <span className="w-4 shrink-0" aria-hidden />}
        <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
          <input
            type="checkbox"
            checked={item.done}
            onChange={() => onToggle(item.id)}
            className="shrink-0"
          />
          <span
            className={cn(
              'truncate',
              item.done && 'line-through text-muted-foreground'
            )}
          >
            {item.title}
          </span>
        </label>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToggleNotes}
            aria-expanded={notesOpen}
            aria-label="Notes"
            title="Notes"
            className={cn(
              'text-muted-foreground hover:text-foreground',
              item.notes && 'text-foreground'
            )}
          >
            <StickyNote className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            Remove
          </Button>
        </div>
      </div>

      {notesOpen && (
        <div className="mt-1.5 pl-6">
          <Textarea
            value={notesValue}
            onChange={handleNotesChange}
            placeholder="Add notes..."
            className="text-sm min-h-[60px]"
          />
        </div>
      )}
    </li>
  );
}

function SortableTodoRow(
  props: Omit<TodoRowProps, 'dragHandle' | 'setNodeRef' | 'style' | 'isDragging'>
) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TodoRow
      {...props}
      setNodeRef={setNodeRef}
      style={style}
      isDragging={isDragging}
      dragHandle={
        <button
          type="button"
          className={cn(
            'shrink-0 text-muted-foreground cursor-grab active:cursor-grabbing touch-none p-0.5 -ml-0.5 hover:text-foreground',
            'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
            isDragging && 'opacity-100'
          )}
          aria-label="Reorder"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      }
    />
  );
}

export function TodoView() {
  const {
    items,
    hydrated,
    add,
    remove,
    toggle,
    reorderActive,
    clearCompleted,
    updateNotes,
    hasCompleted,
  } = useTodo();
  const [inputValue, setInputValue] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeItems = useMemo(() => items.filter((i) => !i.done), [items]);
  const completedItems = useMemo(() => items.filter((i) => i.done), [items]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputValue.trim();
    if (!value) return;
    add(value);
    setInputValue('');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderActive(String(active.id), String(over.id));
  };

  return (
    <div className="h-full w-full px-6 py-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-semibold text-foreground mb-4">Todo</h1>

        <Card className="border bg-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {items.length === 0
                  ? 'No items yet'
                  : `${activeItems.length} active`}
              </span>
              {hasCompleted && (
                <Button variant="ghost" size="sm" onClick={clearCompleted}>
                  Clear completed
                </Button>
              )}
            </div>

            <form className="flex gap-2" onSubmit={handleSubmit}>
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 border border-border rounded-md px-3 py-2 bg-background text-foreground text-sm"
                placeholder="Add a task..."
                autoComplete="off"
              />
              <Button type="submit" variant="secondary" size="sm">
                Add
              </Button>
            </form>

            {!hydrated ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Your list is empty. Add something above.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <ul className="space-y-1">
                  <SortableContext
                    items={activeItems.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {activeItems.map((item) => (
                      <SortableTodoRow
                        key={item.id}
                        item={item}
                        onToggle={toggle}
                        onRemove={remove}
                        onUpdateNotes={updateNotes}
                      />
                    ))}
                  </SortableContext>
                  {completedItems.map((item) => (
                    <TodoRow
                      key={item.id}
                      item={item}
                      onToggle={toggle}
                      onRemove={remove}
                      onUpdateNotes={updateNotes}
                    />
                  ))}
                </ul>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
