'use client';

import React, { useLayoutEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  DAY_GOAL_INDENT,
  applyDashDashShortcutToLine,
  getLineIndent,
  getLineLayout,
  hasLineMarker,
  isInBulletBlock,
  joinGoalLines,
  newBulletLineFromBlock,
  parseLineMarker,
  shouldContinueOnEnter,
  splitGoalLines,
  toggleCheckboxOnLine,
} from './dayGoalTextUtils';

export interface DayGoalTextareaProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

function autosizeTextarea(el: HTMLTextAreaElement) {
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

export function DayGoalTextarea({
  value,
  placeholder = 'Add goals…',
  onChange,
}: DayGoalTextareaProps) {
  const lines = splitGoalLines(value);
  const lineRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const pendingCursorRef = useRef<{ index: number; cursor: number } | null>(null);

  useLayoutEffect(() => {
    lineRefs.current.forEach((el) => {
      if (el) autosizeTextarea(el);
    });

    const pending = pendingCursorRef.current;
    if (pending) {
      const el = lineRefs.current[pending.index];
      if (el) {
        el.focus();
        el.setSelectionRange(pending.cursor, pending.cursor);
      }
      pendingCursorRef.current = null;
    }
  }, [value, lines.length]);

  const commitLines = (nextLines: string[], focusIndex?: number, cursor?: number) => {
    if (focusIndex !== undefined && cursor !== undefined) {
      pendingCursorRef.current = { index: focusIndex, cursor };
    }
    onChange(joinGoalLines(nextLines));
  };

  const updateLine = (index: number, nextLine: string, selectionStart: number) => {
    const shortcut = applyDashDashShortcutToLine(nextLine, selectionStart);
    const resolved = shortcut?.line ?? nextLine;
    const nextLines = [...lines];
    nextLines[index] = resolved;
    const cursor = shortcut?.cursor ?? selectionStart;
    commitLines(nextLines, index, cursor);
  };

  const insertLineAfter = (index: number, content: string, focusIndex?: number, focusCursor = 0) => {
    const nextLines = [...lines.slice(0, index + 1), content, ...lines.slice(index + 1)];
    commitLines(nextLines, focusIndex ?? index + 1, focusCursor);
  };

  const splitLineAt = (index: number, cursor: number) => {
    const line = lines[index];
    const before = line.slice(0, cursor);
    const after = line.slice(cursor);
    const nextLines = [...lines];
    nextLines[index] = before;
    nextLines.splice(index + 1, 0, after);
    commitLines(nextLines, index + 1, 0);
  };

  const handleLineKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    const line = lines[index];
    const el = e.currentTarget;
    const cursor = el.selectionStart ?? 0;
    const selectionEnd = el.selectionEnd ?? cursor;
    const hasSelection = cursor !== selectionEnd;

    if (e.key === 'Enter' && !e.shiftKey && !hasSelection && !e.ctrlKey) {
      e.preventDefault();

      const before = line.slice(0, cursor);
      const after = line.slice(cursor);
      const parsed = parseLineMarker(line);

      if (parsed.marker && parsed.content.trim().length === 0 && after.length === 0) {
        insertLineAfter(index, `${parsed.tabs}${parsed.marker}`, index + 1);
        return;
      }

      if (isInBulletBlock(lines, index) && line.trim().length === 0) {
        insertLineAfter(index, newBulletLineFromBlock(lines, index), index + 1);
        return;
      }

      if (shouldContinueOnEnter(line, index, lines)) {
        splitLineAt(index, cursor);
        return;
      }

      const indent = getLineIndent(line);
      const nextLines = [...lines];
      nextLines[index] = before;
      const newLine = after.length > 0 ? after : indent;
      const focusCursor = after.length > 0 ? 0 : indent.length;
      nextLines.splice(index + 1, 0, newLine);
      commitLines(nextLines, index + 1, focusCursor);
      return;
    }

    if (e.key === 'Backspace' && !hasSelection && cursor === 0) {
      if (isInBulletBlock(lines, index) && !hasLineMarker(line)) {
        e.preventDefault();
        const prev = lines[index - 1] ?? '';
        const merged = prev + line;
        const nextLines = [...lines.slice(0, index - 1), merged, ...lines.slice(index + 1)];
        commitLines(nextLines, index - 1, prev.length);
        return;
      }

      const indent = getLineIndent(line);
      if (indent.length > 0 && !hasLineMarker(line)) {
        e.preventDefault();
        const nextLines = [...lines];
        nextLines[index] = indent.slice(0, -1) + line.slice(indent.length);
        commitLines(nextLines, index, 0);
        return;
      }

      if (indent.length > 0 && hasLineMarker(line)) {
        e.preventDefault();
        const parsed = parseLineMarker(line);
        const nextLines = [...lines];
        nextLines[index] = `${parsed.tabs.slice(0, -1)}${parsed.marker ?? ''}${parsed.content}`;
        commitLines(nextLines, index, parsed.tabs.length - 1);
        return;
      }

      if (index > 0 && line.length === 0) {
        e.preventDefault();
        const prevLine = lines[index - 1];
        const nextLines = lines.filter((_, i) => i !== index);
        commitLines(nextLines, index - 1, prevLine.length);
        return;
      }
    }

    if (e.key === 'Tab' && !e.shiftKey && !hasSelection && cursor === 0) {
      e.preventDefault();
      const nextLines = [...lines];
      nextLines[index] = DAY_GOAL_INDENT + line;
      commitLines(nextLines, index, DAY_GOAL_INDENT.length);
      return;
    }

    if (e.key === 'Enter' && e.ctrlKey && !hasSelection) {
      const toggled = toggleCheckboxOnLine(line);
      if (toggled) {
        e.preventDefault();
        const nextLines = [...lines];
        nextLines[index] = toggled;
        commitLines(nextLines, index, toggled.length);
      }
    }
  };

  const showPlaceholder = value.trim().length === 0;

  return (
    <div
      className={cn(
        'min-h-[5rem] rounded-md border border-border bg-background px-2 py-2',
        'text-xs leading-relaxed font-mono space-y-0'
      )}
    >
      {lines.map((line, index) => {
        const layout = getLineLayout(line, index, lines);
        return (
          <textarea
            key={index}
            ref={(el) => {
              lineRefs.current[index] = el;
            }}
            rows={1}
            value={line}
            onChange={(e) =>
              updateLine(index, e.target.value, e.target.selectionStart ?? e.target.value.length)
            }
            onKeyDown={(e) => handleLineKeyDown(e, index)}
            placeholder={showPlaceholder && index === 0 ? placeholder : undefined}
            spellCheck
            className={cn(
              'block w-full resize-none overflow-hidden bg-transparent border-0 p-0',
              'text-xs leading-relaxed font-mono text-foreground',
              'placeholder:text-muted-foreground focus:outline-none focus:ring-0',
              'whitespace-pre-wrap break-words'
            )}
            style={{
              paddingLeft: `${layout.paddingEm}em`,
              textIndent: layout.mode === 'hanging' ? `-${layout.hangEm}em` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
