# Daily Planner App

A modern task planning application built with Next.js and TailwindCSS.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
# Regular start
npm run dev

# Clean start (clears cache first)
npm run dev:clean
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Memory Management

- The app is configured to use 4GB of memory for better performance
- If you experience any issues:
  - Use `npm run clean` to clear the cache
  - Restart with `npm run dev:clean`

## Features

- Task management with drag-and-drop
- Dark mode support
- Copy/paste tasks
- Time-based task organization
- Responsive design
- Task pool for unscheduled tasks
- Pinned tasks for quick access

## Project Structure

- `/app` - Next.js application routes and pages
- `/components` - React components organized by functionality
  - `/components/planner` - Main planner-specific components
  - `/components/ui` - Reusable UI components
- `/hooks` - Custom React hooks for state management and logic
- `/lib` - Core utilities and constants
- `/types` - TypeScript type definitions
- `/utils` - Utility functions for formatting, storage, etc.

## Architecture

For a more detailed overview of the application architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Testing

Run the test suite with:

```bash
npm test
```

## Recent Changes

- **Project Editing**: Added ability to edit projects directly from the project detail page.
- **Component Extraction**: Extracted `TaskCard` from `DailyPlanner` for better code organization
- **Modal Management**: Added dedicated `useModalManager` hook to centralize modal state and functions
- **Documentation**: Added JSDoc comments and README files across the codebase
- **Improved Type Safety**: Enhanced TypeScript type definitions and interfaces

## Troubleshooting

If you encounter any issues:

1. Clear the cache:
```bash
npm run clean
```

2. Delete node_modules and reinstall:
```bash
rm -rf node_modules
npm install
```

3. Start fresh:
```bash
npm run dev:clean
``` 