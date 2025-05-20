# Contributing to Daily Planner

This document provides guidelines and instructions for developers who want to extend or modify the Daily Planner application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Code Style](#code-style)
5. [Adding New Features](#adding-new-features)
6. [Testing](#testing)

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Start the development server with `npm run dev`
4. Run tests with `npm test`

## Project Structure

The application is organized into several key directories:

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

## Development Workflow

1. Create a new branch for your feature or bugfix
2. Make your changes
3. Run tests to ensure everything works
4. Submit a pull request

## Code Style

- Use TypeScript for all new code
- Add JSDoc comments to functions and interfaces
- Follow the existing code style (indentation, naming conventions, etc.)
- Use functional components and hooks rather than class components
- Put reusable logic in custom hooks
- Keep components focused on a single responsibility

## Adding New Features

### Adding a New Component

1. Create a new file in the appropriate directory (e.g., `components/planner/MyComponent.tsx`)
2. Import any necessary types from `types/index.ts`
3. Use existing UI components from `components/ui` when possible
4. Export the component as the default export
5. Add the component to the appropriate index.ts file

### Adding New State Management

1. If adding new state that's specific to a single component, use local React state
2. If adding state that needs to be shared across components:
   - Add the state to the appropriate hook (e.g., `useDailyPlannerState.ts`)
   - Export any new types from the hook's file or from `types/index.ts`
   - Update the hook's return value to include the new state

### Adding New Modal Functionality

1. Add any new modal-related state to `useModalManager.ts`
2. Add functions to open, close, and handle actions for the modal
3. Update the `ModalManagerState` interface to include the new state and functions
4. Use the new functionality in your components by accessing it through the hook

## Testing

- Write tests for new functionality in the `__tests__` directory
- Run tests with `npm test`
- Ensure your changes don't break existing functionality 