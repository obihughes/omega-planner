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

The application follows a modular structure with clear separation of concerns:

- `/app` - Next.js application routes and pages
- `/components` - React components organized by functionality
  - `/components/planner` - Main planner-specific components
  - `/components/ui` - Reusable UI components
- `/hooks` - Custom React hooks for state management and logic
- `/lib` - Core utilities and constants
- `/types` - TypeScript type definitions
- `/utils` - Utility functions for formatting, storage, etc.
- `/docs` - Documentation files
- `/tests` - Test files and test utilities

## 2. State Management

The application uses custom hooks for state management:

- **useDailyPlanner** (`hooks/useDailyPlannerState.ts`): 
  Main state management hook that centralizes:
  * Core data: `tasks`, `poolTasks`, `pinnedTasks`, `taskIdCounter`
  * UI state: `activeSidebarTab`, `draggingTask`, `resizingTask`, etc.
  * Core task manipulation functions

- **useModalManager** (`hooks/useModalManager.ts`):
  Centralized management for all modals and popups:
  * Edit task modals
  * Color pickers
  * Confirmation dialogs
  * Modal-specific action handlers

Data is loaded from and saved to `localStorage` via utility functions in `utils/storage.ts`.

## 3. Key Components

The application is built with these main components:

- **DailyPlanner** (`components/planner/DailyPlanner.tsx`): 
  The main component orchestrating the entire planner interface, including the timeline view.

- **TaskCard** (`components/planner/TaskCard.tsx`): 
  Reusable component for rendering individual task cards in the timeline. Handles:
  * Task appearance and styling
  * Drag and resize interactions
  * Context menus and inline editing

- **TaskPoolSidebar** (`components/planner/TaskPoolSidebar.tsx`):
  Sidebar component for managing task templates/pool tasks.

- **PinnedTasksSidebar** (`components/planner/PinnedTasksSidebar.tsx`):
  Sidebar component for displaying and managing pinned tasks.

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

The application uses Tailwind CSS for styling:
- Consistent color palette defined in tailwind.config.js
- Responsive design for different screen sizes
- Dark mode support with `dark:` variants
- Custom utility classes for specialized UI elements

## 6. Utility Functions

The application includes various utility functions:

*   `utils/formatters.ts`: Contains functions like `formatTime`, `formatDuration`.
*   `utils/storage.ts`: Handles all interactions with `localStorage` for saving and loading application data (tasks, settings, etc.).
*   `lib/constants.ts`: Contains application-wide constants like colors, timeline settings, etc.
*   `lib/utils.ts`: General utility functions used throughout the application.

## 7. Data Storage

*   **Primary Storage:** Browser `localStorage`.
*   **Keys Used:**
    *   `TASK_KEY` (for main timeline tasks)
    *   `POOL_TASKS_KEY` (for task pool)
    *   `PINNED_TASKS_KEY` (for pinned tasks)
    *   `TASK_ID_COUNTER_KEY` (for the next available task ID)
    *   `DAY_VIEW_SETTINGS_KEY` (for `topDayOffset` and `bottomDayOffset`) 