'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  CollisionDetection,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core';
import { nanoid } from 'nanoid';
import { format } from 'date-fns';
import { GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { MonthBoardNote, MonthBoardState, MonthNoteSource, MonthNoteTarget } from '@/types/monthBoard';
import { DAYS_PER_WEEK, MONTH_BOARD_WEEK_COUNT } from '@/types/monthBoard';
import {
  getDefaultHorizonMondayKey,
  MonthBoardStorage,
  rollHorizonToCurrentWeek,
} from '@/utils/monthBoardStorage';
import { addDaysToDateKey, dateFromDateKey, getTodayDateKey } from '@/utils/dateUtils';

const DROP_BACKLOG = 'mbd-backlog';

/** Backlog-only: grows vertically with content so inner scrollbars are not needed */
function AutosizeTextarea({
  className,
  value,
  ...props
}: React.ComponentProps<typeof Textarea>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const v = typeof value === 'string' ? value : '';

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [v]);

  return (
    <Textarea
      ref={ref}
      value={value}
      rows={1}
      className={cn('resize-none overflow-hidden', className)}
      {...props}
    />
  );
}

function dropWeekId(weekIndex: number) {
  return `mbd-w${weekIndex}-week`;
}

function dropDayId(weekIndex: number, dayIndex: number) {
  return `mbd-w${weekIndex}-d${dayIndex}`;
}

function draggableNoteId(noteId: string) {
  return `mbn-${noteId}`;
}

function parseDraggableNoteId(id: string | number): string | null {
  const s = String(id);
  if (!s.startsWith('mbn-')) return null;
  return s.slice(4);
}

function parseDropTarget(id: string | number): MonthNoteTarget | null {
  const s = String(id);
  if (s === DROP_BACKLOG) return { kind: 'backlog' };
  const wk = /^mbd-w(\d+)-week$/.exec(s);
  if (wk) return { kind: 'week', weekIndex: Number(wk[1]) };
  const dy = /^mbd-w(\d+)-d(\d+)$/.exec(s);
  if (dy) return { kind: 'day', weekIndex: Number(dy[1]), dayIndex: Number(dy[2]) };
  return null;
}

/** Prefer drop zones over note draggables when pointers overlap nested targets */
const monthBoardCollision: CollisionDetection = (args) => {
  const collisions = pointerWithin(args);
  const drop = collisions.find((c) => String(c.id).startsWith('mbd-'));
  if (drop) return [drop];
  return collisions;
};

function sameTarget(a: MonthNoteSource | MonthNoteTarget, b: MonthNoteTarget): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'backlog' && b.kind === 'backlog') return true;
  if (a.kind === 'week' && b.kind === 'week') return a.weekIndex === b.weekIndex;
  if (a.kind === 'day' && b.kind === 'day') {
    return a.weekIndex === b.weekIndex && a.dayIndex === b.dayIndex;
  }
  return false;
}

function formatWeekRangeLabel(mondayKey: string): string {
  const start = dateFromDateKey(mondayKey);
  const sundayKey = addDaysToDateKey(mondayKey, 6);
  const end = dateFromDateKey(sundayKey);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${format(start, 'MMM d')}–${format(end, 'd, yyyy')}`;
  }
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}

function formatDayParts(dateKey: string): { dow: string; dom: string } {
  const d = dateFromDateKey(dateKey);
  return { dow: format(d, 'EEE'), dom: format(d, 'd') };
}

function cloneState(s: MonthBoardState): MonthBoardState {
  return {
    ...s,
    backlog: s.backlog.map((n) => ({ ...n })),
    weeks: s.weeks.map((w) => ({
      weekNotes: w.weekNotes.map((n) => ({ ...n })),
      days: w.days.map((col) => col.map((n) => ({ ...n }))),
    })),
  };
}

function removeNote(
  draft: MonthBoardState,
  source: MonthNoteSource,
  noteId: string
): MonthBoardNote | null {
  if (source.kind === 'backlog') {
    const i = draft.backlog.findIndex((n) => n.id === noteId);
    if (i < 0) return null;
    const [removed] = draft.backlog.splice(i, 1);
    return removed;
  }
  if (source.kind === 'week') {
    const list = draft.weeks[source.weekIndex]?.weekNotes;
    if (!list) return null;
    const i = list.findIndex((n) => n.id === noteId);
    if (i < 0) return null;
    const [removed] = list.splice(i, 1);
    return removed;
  }
  const list = draft.weeks[source.weekIndex]?.days[source.dayIndex];
  if (!list) return null;
  const i = list.findIndex((n) => n.id === noteId);
  if (i < 0) return null;
  const [removed] = list.splice(i, 1);
  return removed;
}

function appendNote(draft: MonthBoardState, target: MonthNoteTarget, note: MonthBoardNote): void {
  if (target.kind === 'backlog') {
    draft.backlog.push(note);
    return;
  }
  if (target.kind === 'week') {
    draft.weeks[target.weekIndex].weekNotes.push(note);
    return;
  }
  draft.weeks[target.weekIndex].days[target.dayIndex].push(note);
}

export function MonthBoard() {
  const [state, setState] = useState<MonthBoardState | null>(null);
  const [draftInput, setDraftInput] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const weekBlockRefs = useRef<Map<number, HTMLElement>>(new Map());
  const didAutoScrollRef = useRef(false);

  useEffect(() => {
    setState(rollHorizonToCurrentWeek(MonthBoardStorage.load()));
  }, []);

  useEffect(() => {
    if (!state) return;
    const t = window.setTimeout(() => MonthBoardStorage.save(state), 320);
    return () => window.clearTimeout(t);
  }, [state]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const weekMondayKeys = useMemo(() => {
    if (!state) return [];
    const keys: string[] = [];
    for (let w = 0; w < MONTH_BOARD_WEEK_COUNT; w++) {
      keys.push(addDaysToDateKey(state.horizonStartKey, w * 7));
    }
    return keys;
  }, [state?.horizonStartKey]);

  const currentWeekIndex = useMemo(() => {
    const currentMonday = getDefaultHorizonMondayKey();
    return weekMondayKeys.findIndex((key) => key === currentMonday);
  }, [weekMondayKeys]);

  useEffect(() => {
    if (!state || currentWeekIndex < 0) return;
    if (didAutoScrollRef.current) return;

    const timeoutId = window.setTimeout(() => {
      const scrollContainer = scrollContainerRef.current;
      const weekEl = weekBlockRefs.current.get(currentWeekIndex);
      if (!scrollContainer || !weekEl) return;

      const containerRect = scrollContainer.getBoundingClientRect();
      const weekRect = weekEl.getBoundingClientRect();
      const weekHeight = weekRect.height;
      const containerHeight = scrollContainer.clientHeight;
      const scrollTop =
        scrollContainer.scrollTop +
        (weekRect.top - containerRect.top) -
        containerHeight / 2 +
        weekHeight / 2;

      scrollContainer.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'auto',
      });
      didAutoScrollRef.current = true;
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, [state, currentWeekIndex]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const noteId = parseDraggableNoteId(active.id);
    if (!noteId) return;
    const source = active.data.current?.source as MonthNoteSource | undefined;
    if (!source) return;
    const target = parseDropTarget(over.id);
    if (!target) return;

    if (sameTarget(source, target)) return;

    const fromBacklog = source.kind === 'backlog';

    setState((prev) => {
      if (!prev) return prev;
      const next = cloneState(prev);

      if (fromBacklog) {
        const moved = removeNote(next, { kind: 'backlog' }, noteId);
        if (!moved) return prev;
        appendNote(next, target, moved);
        return next;
      }

      const moved = removeNote(next, source, noteId);
      if (!moved) return prev;
      appendNote(next, target, moved);
      return next;
    });
  }, []);

  const addBacklogNote = useCallback(() => {
    const text = draftInput.trim();
    if (!text) return;
    setDraftInput('');
    setState((prev) => {
      if (!prev) return prev;
      const next = cloneState(prev);
      next.backlog.push({ id: nanoid(), text });
      return next;
    });
  }, [draftInput]);

  const deleteNote = useCallback((source: MonthNoteSource, noteId: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = cloneState(prev);
      removeNote(next, source, noteId);
      return next;
    });
  }, []);

  const updateNoteText = useCallback((source: MonthNoteSource, noteId: string, text: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = cloneState(prev);
      if (source.kind === 'backlog') {
        const n = next.backlog.find((x) => x.id === noteId);
        if (n) n.text = text;
      } else if (source.kind === 'week') {
        const n = next.weeks[source.weekIndex]?.weekNotes.find((x) => x.id === noteId);
        if (n) n.text = text;
      } else {
        const n = next.weeks[source.weekIndex]?.days[source.dayIndex]?.find((x) => x.id === noteId);
        if (n) n.text = text;
      }
      return next;
    });
  }, []);

  const upsertWeekInlineNote = useCallback((weekIndex: number, noteId: string, text: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = cloneState(prev);
      const list = next.weeks[weekIndex]?.weekNotes;
      if (!list) return prev;
      if (list.length === 0) {
        list.push({ id: noteId, text });
      } else if (list.length === 1 && list[0].id === noteId) {
        list[0].text = text;
      }
      return next;
    });
  }, []);

  const upsertDayInlineNote = useCallback(
    (weekIndex: number, dayIndex: number, noteId: string, text: string) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = cloneState(prev);
        const list = next.weeks[weekIndex]?.days[dayIndex];
        if (!list) return prev;
        if (list.length === 0) {
          list.push({ id: noteId, text });
        } else if (list.length === 1 && list[0].id === noteId) {
          list[0].text = text;
        }
        return next;
      });
    },
    []
  );

  if (!state) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Loading…</div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={monthBoardCollision} onDragEnd={handleDragEnd}>
      <div className="flex h-full min-h-0 flex-col gap-3 p-4 md:p-6">
        <header className="shrink-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Month board</h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Plan several months with different precision: use the week column for broad plans, or day rows for
            detail. Drag the grip to move a note from the backlog into a week or day, or between slots. Drag back to
            the backlog to unschedule.
          </p>
        </header>

        <div
          ref={scrollContainerRef}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto lg:flex-row lg:items-start"
        >
          <div className="min-w-0 flex-1 overflow-x-hidden rounded-xl border border-border/60 bg-card/40 pr-1">
            <div className="flex flex-col gap-6 p-3 md:p-4">
              {weekMondayKeys.map((mondayKey, weekIndex) => (
                <WeekBlock
                  key={mondayKey}
                  weekIndex={weekIndex}
                  mondayKey={mondayKey}
                  week={state.weeks[weekIndex]}
                  sectionRef={(el) => {
                    if (el) weekBlockRefs.current.set(weekIndex, el);
                    else weekBlockRefs.current.delete(weekIndex);
                  }}
                  onDelete={(source, id) => deleteNote(source, id)}
                  onTextChange={(source, id, text) => updateNoteText(source, id, text)}
                  onUpsertWeekInline={(noteId, text) => upsertWeekInlineNote(weekIndex, noteId, text)}
                  onUpsertDayInline={(dayIndex, noteId, text) =>
                    upsertDayInlineNote(weekIndex, dayIndex, noteId, text)
                  }
                />
              ))}
            </div>
          </div>

          <BacklogPanel
            backlog={state.backlog}
            draftInput={draftInput}
            onDraftChange={setDraftInput}
            onAdd={addBacklogNote}
            onDelete={(id) => deleteNote({ kind: 'backlog' }, id)}
            onTextChange={(id, text) => updateNoteText({ kind: 'backlog' }, id, text)}
          />
        </div>
      </div>
    </DndContext>
  );
}

function BacklogPanel({
  backlog,
  draftInput,
  onDraftChange,
  onAdd,
  onDelete,
  onTextChange,
}: {
  backlog: MonthBoardNote[];
  draftInput: string;
  onDraftChange: (v: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onTextChange: (id: string, text: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: DROP_BACKLOG,
    data: { target: { kind: 'backlog' } },
  });

  return (
    <aside
      className={cn(
        'flex w-full shrink-0 flex-col gap-3 self-start rounded-xl border border-border/60 bg-card/50 p-4 lg:w-[min(100%,320px)] lg:max-w-sm',
        isOver && 'ring-2 ring-primary/40'
      )}
    >
      <h2 className="text-lg font-medium">Backlog</h2>
      <AutosizeTextarea
        value={draftInput}
        onChange={(e) => onDraftChange(e.target.value)}
        className="min-h-[88px] bg-background/80 text-sm"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onAdd();
          }
        }}
      />
      <Button type="button" onClick={onAdd} className="rounded-full self-start">
        Add
      </Button>
      <div ref={setNodeRef} className="flex min-h-[120px] flex-col gap-2">
        {backlog.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            source={{ kind: 'backlog' }}
            autosizeText
            onDelete={() => onDelete(note.id)}
            onTextChange={(text) => onTextChange(note.id, text)}
          />
        ))}
      </div>
    </aside>
  );
}

function WeekBlock({
  weekIndex,
  mondayKey,
  week,
  sectionRef,
  onDelete,
  onTextChange,
  onUpsertWeekInline,
  onUpsertDayInline,
}: {
  weekIndex: number;
  mondayKey: string;
  week: MonthBoardState['weeks'][number];
  sectionRef?: (el: HTMLElement | null) => void;
  onDelete: (source: MonthNoteSource, id: string) => void;
  onTextChange: (source: MonthNoteSource, id: string, text: string) => void;
  onUpsertWeekInline: (noteId: string, text: string) => void;
  onUpsertDayInline: (dayIndex: number, noteId: string, text: string) => void;
}) {
  const rangeLabel = formatWeekRangeLabel(mondayKey);

  return (
    <section
      ref={sectionRef}
      id={`month-board-week-${weekIndex}`}
      className="overflow-x-hidden rounded-xl border border-border/50 bg-background/50 p-3 shadow-sm"
    >
      <div className="mb-3 flex flex-wrap items-baseline gap-2 border-b border-border/40 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">Week {weekIndex + 1}</span>
        <span className="text-sm font-medium tabular-nums text-foreground">{rangeLabel}</span>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
        <div className="min-w-0 flex-1 space-y-2">
          {Array.from({ length: DAYS_PER_WEEK }, (_, dayIndex) => {
            const dateKey = addDaysToDateKey(mondayKey, dayIndex);
            const { dow, dom } = formatDayParts(dateKey);
            const isToday = dateKey === getTodayDateKey();
            return (
              <DayRow
                key={dateKey}
                weekIndex={weekIndex}
                dayIndex={dayIndex}
                dow={dow}
                dom={dom}
                isToday={isToday}
                notes={week.days[dayIndex] ?? []}
                onDelete={(id) => onDelete({ kind: 'day', weekIndex, dayIndex }, id)}
                onTextChange={(id, text) => onTextChange({ kind: 'day', weekIndex, dayIndex }, id, text)}
                onUpsertInline={(noteId, text) => onUpsertDayInline(dayIndex, noteId, text)}
              />
            );
          })}
        </div>
        <div className="md:w-[min(100%,330px)] shrink-0">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Week focus</p>
          <WeekColumnDrop
            weekIndex={weekIndex}
            notes={week.weekNotes}
            onDelete={(id) => onDelete({ kind: 'week', weekIndex }, id)}
            onTextChange={(id, text) => onTextChange({ kind: 'week', weekIndex }, id, text)}
            onUpsertInline={onUpsertWeekInline}
          />
        </div>
      </div>
    </section>
  );
}

function WeekColumnDrop({
  weekIndex,
  notes,
  onDelete,
  onTextChange,
  onUpsertInline,
}: {
  weekIndex: number;
  notes: MonthBoardNote[];
  onDelete: (id: string) => void;
  onTextChange: (id: string, text: string) => void;
  onUpsertInline: (noteId: string, text: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dropWeekId(weekIndex),
    data: { target: { kind: 'week', weekIndex } },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[180px] flex-col gap-2 rounded-lg border border-dashed border-border/60 bg-muted/20 p-2',
        isOver && 'border-primary/60 bg-primary/5'
      )}
    >
      {notes.length <= 1 ? (
        <SlotNoteEditor
          note={notes[0]}
          source={{ kind: 'week', weekIndex }}
          variant="week"
          autosizeText
          onEnsureNote={onUpsertInline}
          onTextChange={(id, text) => onTextChange(id, text)}
          onDelete={(id) => onDelete(id)}
        />
      ) : (
        notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            source={{ kind: 'week', weekIndex }}
            autosizeText
            onDelete={() => onDelete(note.id)}
            onTextChange={(text) => onTextChange(note.id, text)}
          />
        ))
      )}
    </div>
  );
}

function DayRow({
  weekIndex,
  dayIndex,
  dow,
  dom,
  isToday,
  notes,
  onDelete,
  onTextChange,
  onUpsertInline,
}: {
  weekIndex: number;
  dayIndex: number;
  dow: string;
  dom: string;
  isToday: boolean;
  notes: MonthBoardNote[];
  onDelete: (id: string) => void;
  onTextChange: (id: string, text: string) => void;
  onUpsertInline: (noteId: string, text: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dropDayId(weekIndex, dayIndex),
    data: { target: { kind: 'day', weekIndex, dayIndex } },
  });

  return (
    <div
      className={cn(
        'flex gap-2 rounded-lg border border-transparent py-1 pl-1 pr-2 transition-colors',
        isToday && 'bg-primary/5 border-primary/20'
      )}
    >
      <div className="flex w-14 shrink-0 flex-col items-center justify-start pt-1 text-center sm:w-16">
        <span className="text-[11px] font-medium leading-tight text-foreground sm:text-xs">{dow}</span>
        <span
          className={cn(
            'text-sm tabular-nums leading-tight text-muted-foreground sm:text-base',
            isToday && 'font-semibold text-primary'
          )}
        >
          {dom}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[52px] min-w-0 flex-1 flex-col gap-1.5 rounded-md border border-border/50 bg-muted/15 p-1.5',
          isOver && 'ring-2 ring-primary/35'
        )}
      >
        {notes.length <= 1 ? (
          <SlotNoteEditor
            note={notes[0]}
            source={{ kind: 'day', weekIndex, dayIndex }}
            onEnsureNote={onUpsertInline}
            onTextChange={(id, text) => onTextChange(id, text)}
            onDelete={(id) => onDelete(id)}
          />
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              source={{ kind: 'day', weekIndex, dayIndex }}
              onDelete={() => onDelete(note.id)}
              onTextChange={(text) => onTextChange(note.id, text)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Single editor for empty or one-note slots. Uses a stable note id on first keystroke so the
 * textarea is not swapped for NoteCard (which previously stole focus after one character).
 */
function SlotNoteEditor({
  note,
  source,
  variant = 'day',
  autosizeText,
  onEnsureNote,
  onTextChange,
  onDelete,
}: {
  note?: MonthBoardNote;
  source: MonthNoteSource;
  variant?: 'day' | 'week';
  autosizeText?: boolean;
  onEnsureNote: (noteId: string, text: string) => void;
  onTextChange: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  const pendingIdRef = useRef<string | null>(note?.id ?? null);
  if (note) pendingIdRef.current = note.id;

  const noteId = note?.id ?? pendingIdRef.current;
  const hasNote = Boolean(note);

  const pendingDragId =
    source.kind === 'week'
      ? `mbn-pending-w${source.weekIndex}`
      : source.kind === 'day'
        ? `mbn-pending-w${source.weekIndex}-d${source.dayIndex}`
        : 'mbn-pending-backlog';

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: noteId ? draggableNoteId(noteId) : pendingDragId,
    data: { source },
    disabled: !hasNote,
  });

  const isWeek = variant === 'week';
  const text = note?.text ?? '';

  const handleTextChange = (value: string) => {
    if (note) {
      onTextChange(note.id, value);
      return;
    }
    const id = pendingIdRef.current ?? nanoid();
    pendingIdRef.current = id;
    onEnsureNote(id, value);
  };

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  const textareaClassName = cn(
    'flex-1 border-0 bg-transparent px-1 py-1.5 text-sm shadow-none focus-visible:ring-0',
    isWeek ? 'min-h-[140px]' : 'min-h-[44px]',
    !autosizeText && 'resize-y'
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex min-w-0 max-w-full gap-1 rounded-lg border border-border/60 bg-card/90 p-1 shadow-sm',
        isDragging && 'shadow-md',
        !hasNote && 'border-dashed border-border/40 bg-transparent shadow-none'
      )}
    >
      {hasNote ? (
        <button
          type="button"
          className="mt-0.5 flex h-8 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
          aria-label="Drag note"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      ) : (
        <div className="mt-0.5 h-8 w-7 shrink-0" aria-hidden />
      )}
      {autosizeText ? (
        <AutosizeTextarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onPointerDownCapture={(e) => e.stopPropagation()}
          className={textareaClassName}
        />
      ) : (
        <Textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onPointerDownCapture={(e) => e.stopPropagation()}
          className={textareaClassName}
          rows={isWeek ? 5 : 2}
        />
      )}
      {hasNote ? (
        <button
          type="button"
          onClick={() => onDelete(note!.id)}
          className="mt-0.5 flex h-8 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
          aria-label="Remove note"
        >
          <X className="h-4 w-4" />
        </button>
      ) : (
        <div className="mt-0.5 h-8 w-7 shrink-0" aria-hidden />
      )}
    </div>
  );
}

function NoteCard({
  note,
  source,
  autosizeText,
  onDelete,
  onTextChange,
}: {
  note: MonthBoardNote;
  source: MonthNoteSource;
  /** Backlog notes: textarea height follows line count (no inner scrollbar) */
  autosizeText?: boolean;
  onDelete: () => void;
  onTextChange: (text: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draggableNoteId(note.id),
    data: { source },
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex min-w-0 max-w-full gap-1 rounded-lg border border-border/60 bg-card/90 p-1 shadow-sm',
        isDragging && 'shadow-md'
      )}
    >
      <button
        type="button"
        className="mt-0.5 flex h-8 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
        aria-label="Drag note"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {autosizeText ? (
        <AutosizeTextarea
          value={note.text}
          onChange={(e) => onTextChange(e.target.value)}
          onPointerDownCapture={(e) => e.stopPropagation()}
          className="min-h-[44px] flex-1 border-0 bg-transparent px-1 py-1.5 text-sm shadow-none focus-visible:ring-0"
        />
      ) : (
        <Textarea
          value={note.text}
          onChange={(e) => onTextChange(e.target.value)}
          onPointerDownCapture={(e) => e.stopPropagation()}
          className="min-h-[44px] flex-1 resize-y border-0 bg-transparent px-1 py-1.5 text-sm shadow-none focus-visible:ring-0"
          rows={2}
        />
      )}
      <button
        type="button"
        onClick={onDelete}
        className="mt-0.5 flex h-8 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
        aria-label="Remove note"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
