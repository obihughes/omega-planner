# Project Documentation

This directory contains documentation for the project. Below is an overview of the available documentation:

## Directory Structure
- [Project Structure](structure.md) - Overview of the project's directory structure and purpose
- [Component Documentation](components.md) - Documentation for all React components
- [Utility Functions](utils.md) - Documentation for utility functions and helpers
- [Habits](habits.md) - Habits view usage and UI controls
- [API Documentation](api.md) - Documentation for API endpoints and services
- [State Management](state.md) - Documentation for state management and data flow
- [Styling Guide](styling-guide.md) - Documentation for styling conventions and sharp design system

## Feature Documentation
- [Daily Planner](planner.md) - Comprehensive guide to the daily planner feature
- **Month board** - `/month-board` (Settings → Beta features); month/week pickers with week goal + Mon–Sun rows; see [planner.md](planner.md#month-board)
- **Goal Hierarchy** - `/goal-hierarchy` (main sidebar); monthly goal summary; week tabs with inline Study Tracker toggle, week nav, and Open Notes; 7×2 weekly goals grid; daily goals sync with Calendar weekly overview
- Weekly Overview - `/goal-hierarchy` (Calendar sidebar link redirects here; legacy `/calendar?view=weekly-goals` redirects); see [planner.md](planner.md#weekly-overview-page)

## Quick Links
- [Getting Started](getting-started.md) - Quick start guide for new developers
- [Development Guidelines](guidelines.md) - Development best practices and guidelines
- [Troubleshooting](troubleshooting.md) - Common issues and their solutions

## Developer
- **App Map** (`/app-map`) — In-app code hierarchy (routes → pages → components → hooks → storage). Open from Settings → Developer. Source: `lib/appHierarchy.ts`.

## Maintenance
- [Changelog](changelog.md) - Record of significant changes to the project
- [Future Plans](roadmap.md) - Planned features and improvements 