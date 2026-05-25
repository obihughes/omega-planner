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
- `components/recipes` – Recipes view (pantry, shopping, recipes)
- `components/meals` – Pantry and shopping sidebars (used by Recipes page)
- `components/study-tracker` – Study Planner (weekly day cards with tasks, monthly calendar with subject filter)
- `components/todo` – Minimal standalone todo checklist
- `components/ui` – Shared UI primitives (layout, inputs, tabs, etc.)

#### `/lib`
Core library code and utilities that are fundamental to the application's functionality. This includes database configurations, authentication setup, and other core services.

- `lib/appHierarchy.ts` — Curated product-to-code tree for the **App Map** page (`/app-map`). Update when adding routes or major features.

#### `/utils`
Helper functions, custom hooks, and utility functions that are used across different parts of the application.
Includes storage helpers like:
- `utils/pantryStorage.ts` – Pantry local storage
- `utils/recipesStorage.ts` – Recipes local storage
- `utils/shoppingStorage.ts` – Shopping list local storage
- `utils/studyStorage.ts` – Study Planner (subjects, study tasks) local storage
- `utils/todoStorage.ts` – Minimal todo list local storage

#### `/docs`
Project documentation including setup guides, component documentation, and development guidelines.

Additional feature routes in `/app` include:
- `app/recipes` — Recipes page (pantry, shopping list, recipe management); hidden from main sidebar nav
- `app/study-tracker` — Study Planner (weekly view with day cards + tasks, monthly view with subject filter)
- `app/visualizer` — 5-Year Visualizer (Calendar high-level view)
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
