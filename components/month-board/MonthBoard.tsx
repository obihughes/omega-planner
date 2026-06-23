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
import { ChevronLeft, ChevronRight, GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { MonthBoardNote, MonthBoardState, MonthNoteSource, MonthNoteTarget } from '@/types/monthBoard';
import { DAYS_PER_WEEK } from '@/types/monthBoard';
import {
  ensureWeekInState,
  getWeekSlot,
  MonthBoardStorage,
} from '@/utils/monthBoardStorage';
import {
  formatMonthShortLabel,
  getCurrentMonthKey,
  getDefaultWeekStartKeyForMonth,
  getNextWeek,
  getPreviousWeek,
  getWeeksInMonth,
  getYearMonthKeys,
} from '@/utils/monthBoardDates';
import { addDaysToDateKey, dateFromDateKey, getTodayDateKey } from '@/utils/dateUtils';

/** Week goal notes: grows vertically with content */
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

function escapeWeekKey(weekStartKey: string): string {
  return weekStartKey.replace(/-/g, '');
}

function dropWeekId(weekStartKey: string) {
  return `mbd-${escapeWeekKey(weekStartKey)}-week`;
}

function dropDayId(weekStartKey: string, dayIndex: number) {
  return `mbd-${escapeWeekKey(weekStartKey)}-d${dayIndex}`;
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
  const wk = /^mbd-(\d{8})-week$/.exec(s);
  if (wk) {
    const k = wk[1];
    const weekStartKey = `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`;
    return { kind: 'week', weekStartKey };
  }
  const dy = /^mbd-(\d{8})-d(\d+)$/.exec(s);
  if (dy) {
    const k = dy[1];
    const weekStartKey = `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`;
    return { kind: 'day', weekStartKey, dayIndex: Number(dy[2]) };
  }
  return null;
}

const monthBoardCollision: CollisionDetection = (args) => {
  const collisions = pointerWithin(args);
  const drop = collisions.find((c) => String(c.id).startsWith('mbd-'));
  if (drop) return [drop];
  return collisions;
};

function sameTarget(a: MonthNoteSource | MonthNoteTarget, b: MonthNoteTarget): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'week' && b.kind === 'week') return a.weekStartKey === b.weekStartKey;
  if (a.kind === 'day' && b.kind === 'day') {
    return a.weekStartKey === b.weekStartKey && a.dayIndex === b.dayIndex;
  }
  return false;
}

function formatWeekRangeLabel(mondayKey: string): string {
  const start = dateFromDateKey(mondayKey);
  const sundayKey = addDaysToDateKey(mondayKey, DAYS_PER_WEEK - 1);
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

function syncYearFromMonth(draft: MonthBoardState, monthKey: string): void {
  const y = Number(monthKey.slice(0, 4));
  if (!Number.isNaN(y) && y !== draft.year) {
    draft.year = y;
  }
}

function cloneState(s: MonthBoardState): MonthBoardState {
  const weeks: MonthBoardState['weeks'] = {};
  for (const [key, slot] of Object.entries(s.weeks)) {
    weeks[key] = {
      weekNotes: slot.weekNotes.map((n) => ({ ...n })),
      days: slot.days.map((col) => col.map((n) => ({ ...n }))),
    };
  }
  return { ...s, weeks };
}

function removeNote(
  draft: MonthBoardState,
  source: MonthNoteSource,
  noteId: string
): MonthBoardNote | null {
  const slot = draft.weeks[source.weekStartKey];
  if (!slot) return null;

  if (source.kind === 'week') {
    const i = slot.weekNotes.findIndex((n) => n.id === noteId);
    if (i < 0) return null;
    const [removed] = slot.weekNotes.splice(i, 1);
    return removed;
  }

  const list = slot.days[source.dayIndex];
  if (!list) return null;
  const i = list.findIndex((n) => n.id === noteId);
  if (i < 0) return null;
  const [removed] = list.splice(i, 1);
  return removed;
}

function appendNote(draft: MonthBoardState, target: MonthNoteTarget, note: MonthBoardNote): void {
  const slot = ensureWeekInState(draft, target.weekStartKey);
  if (target.kind === 'week') {
    slot.weekNotes.push(note);
    return;
  }
  if (!slot.days[target.dayIndex]) {
    slot.days[target.dayIndex] = [];
  }
  slot.days[target.dayIndex].push(note);
}

export function MonthBoard() {
  const [state, setState] = useState<MonthBoardState | null>(null);

  useEffect(() => {
    setState(MonthBoardStorage.load());
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

  const monthKeys = useMemo(() => {
    if (!state) return [];
    return getYearMonthKeys(state.year);
  }, [state?.year]);

  const weeksInMonth = useMemo(() => {
    if (!state) return [];
    return getWeeksInMonth(state.selectedMonthKey);
  }, [state?.selectedMonthKey]);

  const currentWeek = useMemo(() => {
    if (!state) return null;
    return getWeekSlot(state, state.selectedWeekStartKey);
  }, [state]);

  const selectedWeekIndex = useMemo(() => {
    if (!state) return 0;
    return weeksInMonth.findIndex((w) => w.weekStartKey === state.selectedWeekStartKey);
  }, [state?.selectedWeekStartKey, weeksInMonth]);

  const selectMonth = useCallback((monthKey: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = cloneState(prev);
      syncYearFromMonth(next, monthKey);
      next.selectedMonthKey = monthKey;
      next.selectedWeekStartKey = getDefaultWeekStartKeyForMonth(monthKey);
      ensureWeekInState(next, next.selectedWeekStartKey);
      return next;
    });
  }, []);

  const selectWeek = useCallback((weekStartKey: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = cloneState(prev);
      next.selectedWeekStartKey = weekStartKey;
      ensureWeekInState(next, weekStartKey);
      return next;
    });
  }, []);

  const goPreviousWeek = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev;
      const { monthKey, weekStartKey } = getPreviousWeek(
        prev.selectedMonthKey,
        prev.selectedWeekStartKey
      );
      const next = cloneState(prev);
      syncYearFromMonth(next, monthKey);
      next.selectedMonthKey = monthKey;
      next.selectedWeekStartKey = weekStartKey;
      ensureWeekInState(next, weekStartKey);
      return next;
    });
  }, []);

  const goNextWeek = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev;
      const { monthKey, weekStartKey } = getNextWeek(prev.selectedMonthKey, prev.selectedWeekStartKey);
      const next = cloneState(prev);
      syncYearFromMonth(next, monthKey);
      next.selectedMonthKey = monthKey;
      next.selectedWeekStartKey = weekStartKey;
      ensureWeekInState(next, weekStartKey);
      return next;
    });
  }, []);

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

    setState((prev) => {
      if (!prev) return prev;
      const next = cloneState(prev);
      const moved = removeNote(next, source, noteId);
      if (!moved) return prev;
      appendNote(next, target, moved);
      return next;
    });
  }, []);

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
      const slot = next.weeks[source.weekStartKey];
      if (!slot) return prev;
      if (source.kind === 'week') {
        const n = slot.weekNotes.find((x) => x.id === noteId);
        if (n) n.text = text;
      } else {
        const n = slot.days[source.dayIndex]?.find((x) => x.id === noteId);
        if (n) n.text = text;
      }
      return next;
    });
  }, []);

  const upsertWeekInlineNote = useCallback((weekStartKey: string, noteId: string, text: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = cloneState(prev);
      const list = ensureWeekInState(next, weekStartKey).weekNotes;
      if (list.length === 0) {
        list.push({ id: noteId, text });
      } else if (list.length === 1 && list[0].id === noteId) {
        list[0].text = text;
      }
      return next;
    });
  }, []);

  const upsertDayInlineNote = useCallback(
    (weekStartKey: string, dayIndex: number, noteId: string, text: string) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = cloneState(prev);
        const slot = ensureWeekInState(next, weekStartKey);
        if (!slot.days[dayIndex]) slot.days[dayIndex] = [];
        const list = slot.days[dayIndex];
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

  if (!state || !currentWeek) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Loading…</div>
    );
  }

  const weekStartKey = state.selectedWeekStartKey;
  const rangeLabel = formatWeekRangeLabel(weekStartKey);
  const todayMonthKey = getCurrentMonthKey();

  return (
    <DndContext sensors={sensors} collisionDetection={monthBoardCollision} onDragEnd={handleDragEnd}>
      <div className="flex h-full min-h-0 flex-col gap-3 p-4 md:p-6">
        <header className="shrink-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Month board</h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Pick a month and week, then plan with a week goal column and Mon–Sun day rows. Drag notes
            between slots.
          </p>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden lg:flex-row">
          <MonthPicker
            year={state.year}
            monthKeys={monthKeys}
            selectedMonthKey={state.selectedMonthKey}
            todayMonthKey={todayMonthKey}
            onSelect={selectMonth}
          />

          <WeekSelector
            weeks={weeksInMonth}
            selectedWeekStartKey={state.selectedWeekStartKey}
            selectedWeekIndex={selectedWeekIndex}
            onSelect={selectWeek}
            onPrevious={goPreviousWeek}
            onNext={goNextWeek}
          />

          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-card/40">
            <div className="shrink-0 border-b border-border/40 px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                Week {selectedWeekIndex >= 0 ? selectedWeekIndex + 1 : 1}
              </span>
              <span className="ml-2 text-sm font-medium tabular-nums text-foreground">{rangeLabel}</span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 md:flex-row md:items-stretch md:p-4">
              <div className="md:w-[min(100%,330px)] shrink-0">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Week goal</p>
                <WeekGoalPanel
                  weekStartKey={weekStartKey}
                  notes={currentWeek.weekNotes}
                  onDelete={(id) => deleteNote({ kind: 'week', weekStartKey }, id)}
                  onTextChange={(id, text) => updateNoteText({ kind: 'week', weekStartKey }, id, text)}
                  onUpsertInline={(noteId, text) => upsertWeekInlineNote(weekStartKey, noteId, text)}
                />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                {Array.from({ length: DAYS_PER_WEEK }, (_, dayIndex) => {
                  const dateKey = addDaysToDateKey(weekStartKey, dayIndex);
                  const { dow, dom } = formatDayParts(dateKey);
                  const isToday = dateKey === getTodayDateKey();
                  return (
                    <DayRow
                      key={dateKey}
                      weekStartKey={weekStartKey}
                      dayIndex={dayIndex}
                      dow={dow}
                      dom={dom}
                      isToday={isToday}
                      notes={currentWeek.days[dayIndex] ?? []}
                      onDelete={(id) => deleteNote({ kind: 'day', weekStartKey, dayIndex }, id)}
                      onTextChange={(id, text) =>
                        updateNoteText({ kind: 'day', weekStartKey, dayIndex }, id, text)
                      }
                      onUpsertInline={(noteId, text) =>
                        upsertDayInlineNote(weekStartKey, dayIndex, noteId, text)
                      }
                    />
                  );
                })}
              </div>
            </div>
          </main>
        </div>
      </div>
    </DndContext>
  );
}

function MonthPicker({
  year,
  monthKeys,
  selectedMonthKey,
  todayMonthKey,
  onSelect,
}: {
  year: number;
  monthKeys: string[];
  selectedMonthKey: string;
  todayMonthKey: string;
  onSelect: (monthKey: string) => void;
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-2 rounded-xl border border-border/60 bg-card/50 p-3 lg:w-[120px] lg:max-w-[120px]">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{year}</h2>
      <nav className="flex flex-row flex-wrap gap-1 lg:flex-col lg:flex-nowrap">
        {monthKeys.map((monthKey) => {
          const isSelected = monthKey === selectedMonthKey;
          const isCurrentMonth = monthKey === todayMonthKey;
          return (
            <button
              key={monthKey}
              type="button"
              onClick={() => onSelect(monthKey)}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors text-left',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                isCurrentMonth && !isSelected && 'ring-1 ring-primary/30'
              )}
            >
              {formatMonthShortLabel(monthKey)}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function WeekSelector({
  weeks,
  selectedWeekStartKey,
  selectedWeekIndex,
  onSelect,
  onPrevious,
  onNext,
}: {
  weeks: { weekIndex: number; weekStartKey: string }[];
  selectedWeekStartKey: string;
  selectedWeekIndex: number;
  onSelect: (weekStartKey: string) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-2 rounded-xl border border-border/60 bg-card/50 p-3 lg:w-[160px] lg:max-w-[160px]">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Weeks</h2>
      <nav className="flex flex-col gap-1">
        {weeks.map(({ weekIndex, weekStartKey }) => {
          const isSelected = weekStartKey === selectedWeekStartKey;
          const label = formatWeekRangeLabel(weekStartKey);
          return (
            <button
              key={weekStartKey}
              type="button"
              onClick={() => onSelect(weekStartKey)}
              className={cn(
                'rounded-md px-3 py-2 text-left text-sm transition-colors',
                isSelected
                  ? 'bg-secondary font-medium text-secondary-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <span className="block text-xs font-semibold text-primary/80">Week {weekIndex + 1}</span>
              <span className="block text-xs tabular-nums">{label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto flex gap-1 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onPrevious}
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onNext}
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      {selectedWeekIndex >= 0 && (
        <p className="text-center text-[11px] text-muted-foreground">
          Week {selectedWeekIndex + 1} of {weeks.length}
        </p>
      )}
    </aside>
  );
}

function WeekGoalPanel({
  weekStartKey,
  notes,
  onDelete,
  onTextChange,
  onUpsertInline,
}: {
  weekStartKey: string;
  notes: MonthBoardNote[];
  onDelete: (id: string) => void;
  onTextChange: (id: string, text: string) => void;
  onUpsertInline: (noteId: string, text: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dropWeekId(weekStartKey),
    data: { target: { kind: 'week', weekStartKey } },
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
          source={{ kind: 'week', weekStartKey }}
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
            source={{ kind: 'week', weekStartKey }}
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
  weekStartKey,
  dayIndex,
  dow,
  dom,
  isToday,
  notes,
  onDelete,
  onTextChange,
  onUpsertInline,
}: {
  weekStartKey: string;
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
    id: dropDayId(weekStartKey, dayIndex),
    data: { target: { kind: 'day', weekStartKey, dayIndex } },
  });

  return (
    <div
      className={cn(
        'flex gap-2 rounded-lg border border-transparent py-1 pl-1 pr-2 transition-colors',
        isToday && 'border-primary/20 bg-primary/5'
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
            source={{ kind: 'day', weekStartKey, dayIndex }}
            onEnsureNote={onUpsertInline}
            onTextChange={(id, text) => onTextChange(id, text)}
            onDelete={(id) => onDelete(id)}
          />
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              source={{ kind: 'day', weekStartKey, dayIndex }}
              onDelete={() => onDelete(note.id)}
              onTextChange={(text) => onTextChange(note.id, text)}
            />
          ))
        )}
      </div>
    </div>
  );
}

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
      ? `mbn-pending-${escapeWeekKey(source.weekStartKey)}-w`
      : `mbn-pending-${escapeWeekKey(source.weekStartKey)}-d${source.dayIndex}`;

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
