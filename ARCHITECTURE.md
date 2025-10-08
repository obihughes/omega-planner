# Daily Planner Application - Architecture Overview

This document provides an overview of the Daily Planner application's architecture, key components, and important conventions.

## Table of Contents

1.  [Project Structure](#project-structure)
2.  [State Management](#state-management)
3.  [Key Components](#key-components)
4.  [Error Handling & Stability](#error-handling--stability)
5.  [UI Layering (Z-Index)](#ui-layering-z-index)
6.  [Styling](#styling)
7.  [Utility Functions](#utility-functions)
8.  [Data Storage](#data-storage)

## 1. Project Structure

The application follows a modular structure with clear separation of concerns:

- `/app` - Next.js application routes and pages
- `/components` - React components organized by functionality
  - `/components/planner` - Main planner-specific components
  - `/components/ui` - Reusable UI components
  - `/components/ErrorBoundary.tsx` - Global error boundary for stability
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

- **AppLayout** (`components/ui/AppLayout.tsx`):
  Main layout wrapper that provides the application structure with a fixed left sidebar navigation and main content area.

- **Navigation** (`components/ui/Navigation.tsx`): 
  Left sidebar navigation component that provides app-wide navigation between different modes (Daily Planner, Calendar, Workspace, Text Documents). Features:
  * Fixed left sidebar with 256px width
  * Vertical navigation with branded header
  * Theme toggle functionality
  * Active state indicators
  * Collapsible navigation sections with expand/collapse controls
  * Persistent collapse state via localStorage
  * Separate Calendar section with Monthly and Yearly views

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

- **YearCalendar** (`components/calendar/YearCalendar.tsx`):
  Calendar component with event and period management functionality.

- **CanvasTextEditor** (`components/canvas/CanvasTextEditor.tsx`):
  Text editing component with performance optimizations for large documents.

## 4. Error Handling & Stability

The application implements a comprehensive error handling strategy to ensure stability:

### **Global Error Boundary**
- **ErrorBoundary** (`components/ErrorBoundary.tsx`): 
  A class-based React component that catches JavaScript errors anywhere in the component tree
  * Wraps the entire application at the root layout level
  * Provides a user-friendly fallback UI when errors occur
  * Logs errors to the console for debugging
  * Includes a "Refresh Page" button for recovery

### **Error Boundary Implementation**
```typescript
// Integrated in app/layout.tsx
<ErrorBoundary>
  <div className="min-h-screen bg-background text-foreground">
    {children}
  </div>
</ErrorBoundary>
```

### **Stability Features**
- **Graceful Error Recovery**: Users can continue using the application even if individual components fail
- **Error Logging**: All uncaught errors are logged for debugging purposes
- **User-Friendly Messaging**: Clear error messages with actionable recovery options
- **Fallback UI**: Maintains application branding and provides recovery options

### **Future Stability Enhancements**
- Granular error boundaries for individual features (Calendar, Text Editor)
- Integration with error monitoring services (Sentry, LogRocket)
- Enhanced type safety with validation libraries (Zod)

## 5. UI Layering (Z-Index)

The application uses `z-index` extensively to manage the stacking of UI elements, especially modals, popups, and interactive timeline components.

*   **Modals & Popups (Highest Layers):**
    *   `Floating Color Picker`: `z-[1005]`
    *   `"Edit Task" Modal`: `z-[1002]`
    *   `"Create New Task" Modal`: `z-[1001]`
    *   `"Clone Confirmation" Modal`: `z-[1001]`
    *   `"Clear Pool Confirmation" Modal`: `z-[1001]`
    *   `Task Card Inline Edit Menu` (Portal): `z-[1000]`

*   **Main UI Structures:**
    *   `Navigation Sidebar` (Fixed left navigation): `z-50`
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

## 6. Styling

The application uses Tailwind CSS for styling:
- Consistent color palette defined in tailwind.config.js
- Responsive design for different screen sizes
- Dark mode support with `dark:` variants
- Custom utility classes for specialized UI elements
- **Font Strategy**: 
  * Primary font: Lexend for modern, readable interface
  * Calendar-specific font: Inter for better number clarity in date displays

## 7. Utility Functions

The application includes various utility functions:

*   `utils/formatters.ts`: Contains functions like `formatTime`, `formatDuration`.
*   `utils/storage.ts`: Handles all interactions with `localStorage` for saving and loading application data (tasks, settings, etc.).
*   `lib/constants.ts`: Contains application-wide constants like colors, timeline settings, etc.
*   `lib/utils.ts`: General utility functions used throughout the application.

## 8. Data Storage

*   **Primary Storage:** Browser `localStorage`.
*   **Keys Used:**
    *   `TASK_KEY` (for main timeline tasks)
    *   `POOL_TASKS_KEY` (for task pool)
    *   `PINNED_TASKS_KEY` (for pinned tasks)
    *   `TASK_ID_COUNTER_KEY` (for the next available task ID)
    *   `DAY_VIEW_SETTINGS_KEY` (for `topDayOffset` and `bottomDayOffset`)

## Date Handling Architecture

**Important**: All date operations throughout the application use **local timezone** consistently to prevent timezone mismatches that can cause tasks to appear on wrong dates when the date changes.

### Key Functions:
- `dateFromDateKey()`: Safely converts YYYY-MM-DD strings to Date objects in local timezone
- `getCalendarDateForColumn()`: Uses local timezone to calculate dates for timeline columns
- `getDateWithoutTime()`: Normalizes dates to midnight in local timezone
- `getDateKey()`: Generates consistent YYYY-MM-DD format date keys in local timezone
- `tasksByDate` mapping: Uses local timezone date keys for task organization

### Recent Fix (Pinned Tasks):
- **Issue**: Pinned tasks displayed incorrect times due to `new Date(baseDateString)` causing timezone interpretation issues
- **Solution**: Updated pinned task dueDate calculation to use `dateFromDateKey()` for timezone-safe parsing
- **Files Updated**: `hooks/useDailyPlannerState.ts` - both task pinning and sync functions now use consistent timezone handling

### Previous Issue Fixed:
- Mixed UTC/local timezone operations were causing tasks to display on incorrect dates
- Now all date calculations, storage, and retrieval use consistent local timezone approach

## Data Flow
1. User interactions trigger state updates in `useDailyPlannerState`
2. State changes are persisted to local storage
3. UI components reactively update based on state changes
4. Date-based task filtering uses consistent local timezone date keys

## Architecture Principles
- **Separation of Concerns**: Clear distinction between UI, state, and data layers
- **Consistent Date Handling**: All date operations use local timezone
- **Real-time Updates**: Immediate UI feedback with persistent storage
- **Modular Design**: Reusable components and hooks 