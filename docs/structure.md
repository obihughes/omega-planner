# Project Structure

This document provides an overview of the project's directory structure and the purpose of each major component.

## Root Directory
The root directory contains configuration files and the main project structure:

### Configuration Files
- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `.env` - Environment variables
- `package.json` - Project dependencies and scripts
- `next-env.d.ts` - Next.js TypeScript declarations

### Main Directories

#### `/app`
Contains the Next.js 13+ app router pages and layouts. This is where the main application routes and page components are defined.
App icon (favicon) is file-based: `app/icon.svg`. Replace this file to change the browser tab icon.

#### `/components`
Reusable React components used throughout the application. These components are organized by feature or functionality.
Current notable feature folders include:
- `components/planner` – Daily/Weekly scheduling
- `components/projects` – Project and task management
- `components/documents` – Text canvas editor
- `components/calendar` – Calendars and modals
- `components/meals` – Meals list and ingredient management
- `components/study-tracker` – Study Planner (weekly day cards with tasks, monthly calendar with subject filter)
- `components/goal-hierarchy` – Goal Hierarchy (month → week → day planning; month/week use summary text only; day grid is two 7-column rows — selected week Mon–Sun + next week Mon–Sun preview; daily goals use shared Weekly Goals storage and `WeeklyGoalsDayColumn`, synced with Calendar weekly overview; inline Study Tracker toggle, week nav, and Open Notes)
- `components/month-board` – Month board beta (month/week pickers, single-week view with week goal + Mon–Sun rows)
- `components/todo` – Minimal standalone todo checklist
- `components/ui` – Shared UI primitives (layout, inputs, tabs, etc.)

#### `/lib`
Core library code and utilities that are fundamental to the application's functionality. This includes database configurations, authentication setup, and other core services.

- `lib/appHierarchy.ts` — Curated product-to-code tree for the **App Map** page (`/app-map`). Update when adding routes or major features.

#### `/utils`
Helper functions, custom hooks, and utility functions that are used across different parts of the application.
Includes storage helpers like:
- `utils/mealsStorage.ts` – Meals local storage (migrates legacy recipes on first load)
- `utils/studyStorage.ts` – Study Planner (subjects, study tasks) local storage
- `utils/todoStorage.ts` – Minimal todo list local storage
- `utils/monthBoardStorage.ts` – Month board local storage (schema v2.0)
- `utils/monthBoardDates.ts` – Month board month/week date helpers

#### `/docs`
Project documentation including setup guides, component documentation, and development guidelines.

Additional feature routes in `/app` include:
- `app/meals` — Meals page (meal names and ingredients); hidden from main sidebar nav — open via Settings → Beta features or `/meals`. Legacy `/recipes` redirects to `/meals`.
- `app/study-tracker` — Study Planner (weekly view with day cards + tasks); hidden from main sidebar — open via Settings → Beta features or `/study-tracker` (also embeddable in Calendar weekly view)
- `app/month-board` — Month board (month/week pickers, week goal + Mon–Sun rows); hidden from main sidebar — open via Settings → Beta features or `/month-board`
- Daily Planner **Week** view (`/?view=weekly`) — hidden from main sidebar — open via Settings → Beta features
- `app/goal-hierarchy` — Goal Hierarchy (monthly / weekly / daily goals); main sidebar nav
- `app/visualizer` — 5-Year Visualizer; main sidebar nav (last item, after Text Documents)
- `app/app-map` — In-app code hierarchy reference (Settings → Developer → App Map); data in `lib/appHierarchy.ts`
- `app/todo` — Minimal todo checklist (main sidebar nav)

#### `/planner-backup`
Backup files for the planner functionality.

### Generated Directories

#### `/node_modules`
Contains all npm dependencies (not tracked in version control).

#### `/.next`
Next.js build output directory (not tracked in version control).

## Best Practices
1. New components should be added to the `/components` directory
2. Utility functions should be placed in `/utils`
3. Core functionality should be added to `/lib`
4. New pages should be created in the `/app` directory following Next.js 13+ conventions
5. Keep documentation up to date in the `/docs` directory

## File Organization
- Components should be organized by feature or functionality
- Each component should have its own directory if it requires multiple files
- Utility functions should be grouped by purpose
- Configuration files should remain in the root directory 
