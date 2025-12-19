import React, { useState, useEffect, useMemo } from 'react';
import { ProjectSeries, SeriesSegment, SeriesSegmentType } from '@/types';
import { generateSeriesTitles } from '@/utils/seriesGenerator';
import { 
  X, 
  Plus, 
  Trash2, 
  GripVertical, 
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SeriesEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (seriesData: Omit<ProjectSeries, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialSeries?: ProjectSeries; // If editing existing
  mode?: 'task' | 'subtask'; // 'task' for project-level, 'subtask' for task-level
}

const SegmentItem = ({ 
  segment, 
  onChange, 
  onRemove 
}: { 
  segment: SeriesSegment; 
  onChange: (updates: Partial<SeriesSegment>) => void;
  onRemove: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: segment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="bg-secondary/20 border border-border p-3 rounded-lg flex items-start gap-3 group"
    >
      <button 
        className="mt-2 text-muted-foreground cursor-grab active:cursor-grabbing hover:text-foreground"
        {...attributes} 
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <select
            value={segment.type}
            onChange={(e) => onChange({ type: e.target.value as SeriesSegmentType })}
            className="bg-background border border-input rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary"
          >
            <option value="text">Static Text</option>
            <option value="number">Number Range</option>
            <option value="letter">Letter Range</option>
          </select>
          <div className="flex-1" />
          <button 
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {segment.type === 'text' && (
            <div className="flex-1">
              <input
                type="text"
                value={segment.value || ''}
                onChange={(e) => onChange({ value: e.target.value })}
                placeholder="Text value (e.g. 'Part ')"
                className="w-full bg-background border border-input rounded px-3 py-2 text-sm"
              />
            </div>
          )}

          {segment.type === 'number' && (
            <div className="flex items-center gap-2 flex-1">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">Start</label>
                <input
                  type="number"
                  value={segment.start || ''}
                  onChange={(e) => onChange({ start: parseInt(e.target.value) || 0 })}
                  className="w-full bg-background border border-input rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">End</label>
                <input
                  type="number"
                  value={segment.end || ''}
                  onChange={(e) => onChange({ end: parseInt(e.target.value) || 0 })}
                  className="w-full bg-background border border-input rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="w-20">
                <label className="text-xs text-muted-foreground block mb-1">Step</label>
                <input
                  type="number"
                  min="1"
                  value={segment.step || 1}
                  onChange={(e) => onChange({ step: parseInt(e.target.value) || 1 })}
                  className="w-full bg-background border border-input rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
          )}

          {segment.type === 'letter' && (
            <div className="flex items-center gap-2 flex-1">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">Start (A-Z)</label>
                <input
                  type="text"
                  maxLength={1}
                  value={segment.start || 'A'}
                  onChange={(e) => onChange({ start: e.target.value.toUpperCase() })}
                  className="w-full bg-background border border-input rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">End (A-Z)</label>
                <input
                  type="text"
                  maxLength={1}
                  value={segment.end || 'Z'}
                  onChange={(e) => onChange({ end: e.target.value.toUpperCase() })}
                  className="w-full bg-background border border-input rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const SeriesEditorModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialSeries,
  mode = 'task'
}: SeriesEditorModalProps) => {
  const [name, setName] = useState('');
  const [segments, setSegments] = useState<SeriesSegment[]>([]);
  const [excludedIndices, setExcludedIndices] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initialSeries) {
        setName(initialSeries.name);
        setSegments(JSON.parse(JSON.stringify(initialSeries.segments))); // Deep copy
        setExcludedIndices(initialSeries.excludedIndices || []);
      } else {
        setName('');
        setSegments([
          { id: '1', type: 'text', value: mode === 'subtask' ? 'Step ' : 'Task ' },
          { id: '2', type: 'number', start: 1, end: 5, step: 1 }
        ]);
        setExcludedIndices([]);
      }
    } else {
      // Reset state when modal closes
      setName('');
      setSegments([]);
      setExcludedIndices([]);
    }
  }, [isOpen, initialSeries, mode]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const generatedPreview = useMemo(() => {
    return generateSeriesTitles(segments);
  }, [segments]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSegments((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addSegment = () => {
    setSegments(prev => [
      ...prev,
      { id: Date.now().toString(), type: 'text', value: '-' }
    ]);
  };

  const updateSegment = (id: string, updates: Partial<SeriesSegment>) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSegment = (id: string) => {
    setSegments(prev => prev.filter(s => s.id !== id));
  };

  const toggleExclusion = (index: number) => {
    setExcludedIndices(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      segments,
      excludedIndices
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold">
            {initialSeries ? `Edit ${mode === 'subtask' ? 'Subtask' : ''} Series` : `Create New ${mode === 'subtask' ? 'Subtask' : ''} Series`}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Editor */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-border scrollbar-thin">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Series Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={mode === 'subtask' ? "e.g. Checklist Steps" : "e.g. Phase 1 Tasks"}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Pattern Builder</label>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={segments.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {segments.map((segment) => (
                        <SegmentItem
                          key={segment.id}
                          segment={segment}
                          onChange={(updates) => updateSegment(segment.id, updates)}
                          onRemove={() => removeSegment(segment.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                
                <button
                  onClick={addSegment}
                  className="mt-3 w-full py-2 border-2 border-dashed border-border rounded-lg hover:bg-accent/50 text-muted-foreground flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Segment
                </button>
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="w-1/3 bg-secondary/10 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border bg-secondary/20">
              <h3 className="font-medium text-sm text-muted-foreground flex items-center justify-between">
                <span>Preview ({generatedPreview.length - excludedIndices.length} items)</span>
                {excludedIndices.length > 0 && (
                   <span className="text-xs text-destructive">{excludedIndices.length} excluded</span>
                )}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {generatedPreview.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm mt-10">
                  No items generated. Check your segments.
                </div>
              ) : (
                <div className="space-y-1">
                  {generatedPreview.map((title, index) => {
                    const isExcluded = excludedIndices.includes(index);
                    return (
                      <div 
                        key={index} 
                        className={`flex items-center gap-3 p-2 rounded text-sm transition-colors ${
                          isExcluded ? 'opacity-50 hover:opacity-70 bg-destructive/10' : 'hover:bg-accent bg-card border border-border/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={() => toggleExclusion(index)}
                          className="rounded border-input text-primary focus:ring-primary"
                        />
                        <span className={isExcluded ? 'line-through text-muted-foreground' : ''}>
                          {title}
                        </span>
                      </div>
                    );
                  })}
                  {generatedPreview.length > 100 && (
                    <div className="text-center text-xs text-muted-foreground pt-2">
                      And {generatedPreview.length - 100} more items...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-background">
            <div className="text-sm text-muted-foreground">
                Click checkboxes in preview to exclude specific items.
            </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || generatedPreview.length === 0}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {initialSeries ? 'Save Changes' : 'Create Series'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
