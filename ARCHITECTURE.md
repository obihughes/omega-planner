# Daily Planner Application - Architecture Overview

This document provides an overview of the Daily Planner application's architecture, key components, and important conventions.

## Table of Contents

1.  [Project Structure](#project-structure)
2.  [State Management](#state-management)
3.  [Key Components](#key-components)
4.  [UI Layering (Z-Index)](#ui-layering-z-index)
5.  [Styling](#styling)
6.  [Utility Functions](#utility-functions)
7.  [Data Storage](#data-storage)

## 1. Project Structure

*(A brief overview of the main directories like `components/`, `hooks/`, `app/`, `utils/`, `types/` and their purpose can be added here later.)*

## 2. State Management

The primary application state for the daily planner view is managed within the `useDailyPlanner` custom hook (`hooks/useDailyPlannerState.ts`). This hook centralizes:
*   Core data: `tasks`, `poolTasks`, `pinnedTasks`, `taskIdCounter`.
*   UI state: `activeSidebarTab`, `draggingTask`, `resizingTask`, `editingTaskId`, modal visibility states (`showClearPoolConfirmation`, `showCloneConfirmation`, `activeEditModalTask`), `copyingTaskData`, `targetCopyDayOffset`, view offsets (`topDayOffset`, `bottomDayOffset`), etc.
*   Core logic and action handlers: Functions for adding, deleting, updating, pinning, pooling, copying, and cloning tasks, as well as conflict detection and date formatting.

Data is loaded from and saved to `localStorage` via utility functions in `utils/storage.ts`.

## 3. Key Components

*(Details about major components like `DailyPlanner.tsx`, `TaskCard.tsx`, `TaskPoolSidebar.tsx`, `PinnedTasksSidebar.tsx` can be added here, describing their responsibilities and primary props.)*

## 4. UI Layering (Z-Index)

The application uses `z-index` extensively to manage the stacking of UI elements, especially modals, popups, and interactive timeline components.

*   **Modals & Popups (Highest Layers):**
    *   `Floating Color Picker`: `z-[1005]`
    *   `"Edit Task" Modal`: `z-[1002]`
    *   `"Create New Task" Modal`: `z-[1001]`
    *   `"Clone Confirmation" Modal`: `z-[1001]`
    *   `"Clear Pool Confirmation" Modal`: `z-[1001]`
    *   `Task Card Inline Edit Menu` (Portal): `z-[1000]`

*   **Main UI Structures:**
    *   `Sidebar Container` (Sticky element holding Task Pool & Pinned Tasks): `z-[120]`
    *   `Current Time Marker` (Red line on today's timeline): `z-[120]`

*   **Task Cards (in Timeline):**
    *   When being actively inline edited (`isCurrentlyEditing` for the card itself): `zIndex: 110`
    *   When being dragged or resized: `zIndex: 100`
    *   Default state: `zIndex: 40`

*   **Timeline Elements:**
    *   `Timeline Header` (Sticky, shows hours): `z-20`
    *   `Pasting Task Highlight Overlay` (Blueish overlay when copying): `z-10` (The div with `animate-pulse`)
    *   `Timeline Grid Lines`: `z-10`

**Stacking Context Notes:**
*   **Portals:** The `TaskCard Inline Edit Menu` uses `ReactDOM.createPortal`.
*   **Sticky Positioning:** The main sidebar container (`DailyPlanner.tsx`) uses `position: sticky`.

## 5. Styling

*(Information about the styling approach, e.g., Tailwind CSS, global styles, component-specific styles, dark mode implementation details.)*

## 6. Utility Functions

*   `utils/formatters.ts`: Contains functions like `formatTime`, `formatDuration`.
*   `utils/storage.ts`: Handles all interactions with `localStorage` for saving and loading application data (tasks, settings, etc.).

## 7. Data Storage

*   **Primary Storage:** Browser `localStorage`.
*   **Keys Used:**
    *   `TASK_KEY` (for main timeline tasks)
    *   `POOL_TASKS_KEY` (for task pool)
    *   `PINNED_TASKS_KEY` (for pinned tasks)
    *   `TASK_ID_COUNTER_KEY` (for the next available task ID)
    *   `DAY_VIEW_SETTINGS_KEY` (for `topDayOffset` and `bottomDayOffset`) 