"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { X, Trash2, ListChecks } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface QuickPlanDraftTask {
  id: string;
  name: string;
}

export interface QuickPlanDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTasks: (tasks: QuickPlanDraftTask[]) => void;
  currentDate: Date;
}

export function QuickPlanDayModal({
  isOpen,
  onClose,
  onAddTasks,
  currentDate,
}: QuickPlanDayModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [draftTasks, setDraftTasks] = useState<QuickPlanDraftTask[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const resetState = useCallback(() => {
    setInputValue("");
    setDraftTasks([]);
  }, []);

  const handleClose = useCallback(
    (shouldPersist: boolean) => {
      if (shouldPersist && draftTasks.length > 0) {
        onAddTasks(draftTasks);
      }
      resetState();
      onClose();
    },
    [draftTasks, onAddTasks, onClose, resetState]
  );

  const handleAddDraftTask = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setDraftTasks((prev) => [
      ...prev,
      {
        id: `quick-plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: trimmed,
      },
    ]);
    setInputValue("");
    inputRef.current?.focus();
  }, [inputValue]);

  const handleRemoveDraftTask = useCallback((taskId: string) => {
    setDraftTasks((prev) => prev.filter((task) => task.id !== taskId));
  }, []);

  const handleClearDraftTasks = useCallback(() => {
    setDraftTasks([]);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-6 sm:pt-8">
      <button
        type="button"
        aria-label="Close plan day modal"
        className="absolute inset-0 bg-background/40 backdrop-blur-[1px]"
        onClick={() => handleClose(true)}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-plan-day-title"
        className={cn(
          "relative z-[60] w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 shrink-0 text-primary" />
              <h2 id="quick-plan-day-title" className="text-sm font-semibold text-foreground">
                Plan Day
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{formattedDate}</p>
          </div>
          <button
            type="button"
            onClick={() => handleClose(true)}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-4">
          <div>
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAddDraftTask();
                }
              }}
              placeholder="Type a task and press Enter..."
              className="h-10"
              autoComplete="off"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Press Enter to add each task. They will appear in this day&apos;s task pool when you close this.
            </p>
          </div>

          {draftTasks.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/20">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-xs font-medium text-foreground">
                  {draftTasks.length} task{draftTasks.length === 1 ? "" : "s"} added
                </span>
                <button
                  type="button"
                  onClick={handleClearDraftTasks}
                  className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clear all
                </button>
              </div>
              <ul className="max-h-48 overflow-y-auto px-2 py-2 space-y-1">
                {draftTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-2 rounded-md bg-background/80 px-2 py-1.5 text-sm"
                  >
                    <span className="min-w-0 truncate text-foreground">{task.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDraftTask(task.id)}
                      className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      aria-label={`Remove ${task.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <Button type="button" variant="outline" size="sm" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={() => handleClose(true)}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
