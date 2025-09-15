# Project Structure

This document provides an overview of the project's directory structure and the purpose of each major component.

## Root Directory
The root directory contains configuration files and the main project structure:

### Configuration Files
- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
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

#### `/lib`
Core library code and utilities that are fundamental to the application's functionality.

#### `/utils`
Helper functions, custom hooks, and utility functions that are used across different parts of the application.

#### `/docs`
Project documentation including setup guides, component documentation, and development guidelines.

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