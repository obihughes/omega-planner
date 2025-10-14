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
- `components/projects` – Workspace views
- `components/documents` – Text canvas editor
- `components/calendar` – Calendars and modals
- `components/meals` – Meal planning components (see `MealPlanner`)
 - `components/ui` – Shared UI primitives (layout, inputs, tabs, etc.)

#### `/lib`
Core library code and utilities that are fundamental to the application's functionality. This includes database configurations, authentication setup, and other core services.

#### `/utils`
Helper functions, custom hooks, and utility functions that are used across different parts of the application.
Includes storage helpers like:
- `utils/mealsStorage.ts` – Meals local storage (consumed by `hooks/useMeals.ts` and exposed via `app/context/MealsContext.tsx`)
- `utils/habitsStorage.ts` – Habits local storage

#### `/docs`
Project documentation including setup guides, component documentation, and development guidelines.

Additional feature routes in `/app` include:
- `app/meals` — Meals planner page
- `app/projects/tasks/weekly` — Weekly scheduler for project tasks (drag to set due dates)
 - `app/projects/workspace` — Project-only workspace: Today vertical list (project tasks with dueDate=today), Projects/Tasks on right; drag or “+ Today” to set dueDate

#### `/app/beta`
Preview and experimental pages moved under Beta:
- `app/beta/workspace` — Workspace Today (was `/projects/workspace`)
- `app/beta/habits` — Habits tracker (was `/habits`)
- `app/beta/tasks` — All Tasks view (mirror of `projects/tasks`)
- `app/beta/tasks/weekly` — Weekly Tasks scheduler (mirror of `projects/tasks/weekly`)

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