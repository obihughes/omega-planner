# Daily Planner App

A modern task planning application built with Next.js and TailwindCSS, featuring comprehensive error handling and performance optimizations.

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

### Core Functionality
- **Advanced Task Management**: Multi-criteria sorting, custom order with drag-and-drop
- **Project Organization**: Task grouping by projects with inline task creation
- **Smart Sorting**: Sort by multiple fields simultaneously (e.g., completion + title)
- **Custom Ordering**: Visual drag-and-drop reordering for tasks and projects
- **Theme support** with full consistency across light, dark, forest, sunset, ocean, and system (Settings)
- **Copy/paste tasks** between dates and time slots
- **Time-based organization** with timeline views
- **Responsive design** for all device sizes
- **Task inbox** for unscheduled tasks
- **Pinned tasks** for quick access

### Meals
- Meals page at `/meals` (hidden from main sidebar; open via Settings → Beta features or direct URL)
- Goal Hierarchy at `/goal-hierarchy` (main sidebar nav; monthly → weekly → daily goal planning)
- Add meals with a name and ingredient list (optional amounts)
- Left-side free-text **Notes** panel (scratchpad; stacks above the grid on small screens)
- Local persistence via `utils/mealsStorage.ts` (migrates legacy recipes data on first load)
- Notes persistence: `utils/mealsNotesStorage.ts` (`omega-planner-meals-notes-v1`)
- Legacy `/recipes` URL redirects to `/meals`

### Calendar Features
- Year-view calendar with event and period management
- Modern, minimalist design with Lexend/Inter font combination
- Eraser mode for easy deletion of events and periods
- Click-to-view details with separate edit functionality
- Long-press to create new periods

### Text Editor Features
- Canvas-based text editor with performance optimizations
- Manual save functionality with visual feedback
- Optimized rendering - only active text blocks re-render
- Autosave with configurable delay

### Stability & Error Handling
- **Global Error Boundary**: Catches and handles JavaScript errors gracefully
- **Fallback UI**: User-friendly error recovery with refresh option
- **Error Logging**: Comprehensive error tracking for debugging
- **Graceful Degradation**: Individual component failures don't crash the entire app

## Project Structure

- `/app` - Next.js application routes and pages
- `/components` - React components organized by functionality
  - `/components/planner` - Main planner-specific components
  - `/components/meals` - Meals list and ingredients
  - `/components/ui` - Reusable UI components
  - `/components/ErrorBoundary.tsx` - Global error boundary for stability
- `/hooks` - Custom React hooks for state management and logic
- `/lib` - Core utilities and constants
- `/types` - TypeScript type definitions
- `/utils` - Utility functions for formatting, storage, etc.

## Architecture

For a more detailed overview of the application architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Performance

The application includes several performance optimizations:
- Memoized components to prevent unnecessary re-renders
- Optimized text editor with selective re-rendering
- Bundle size optimization with tree shaking
- Error boundaries for stability

For detailed performance information, see [PERFORMANCE.md](./PERFORMANCE.md).

## Testing

Run the test suite with:

```bash
npm test
```

## Recent Changes

### Advanced Task Management System (Latest)
- **Multi-Criteria Sorting**: Tasks can now be sorted by multiple fields simultaneously
  - Example: Sort by completion status first, then by title alphabetically
  - Configure up to 4 sort criteria with independent ascending/descending order
  - Intuitive UI for adding, removing, and reordering sort criteria
- **Custom Order with Drag & Drop**: Visual task and project reordering
  - Drag tasks within projects to set custom order
  - Drag projects to reorder them globally
  - Visual indicators when in custom order mode
  - Persistent ordering across sessions
- **Enhanced Task Creation**: 
  - "Add Task" buttons within project groups that pre-select the project
  - Quick-add interface with project selection
  - Full modal for detailed task creation
- **Improved Projects Interface**:
  - Sortable projects with multiple criteria (Name, Progress, Updated, Custom Order)
  - Visual drag-to-reorder indicators
  - Enhanced view controls with comprehensive sorting options

### Copy/Paste Rendering Bug Fix
- **Issue Resolution**: Fixed bug where copied and pasted tasks wouldn't render until page reload or other actions
- **Root Cause**: The `handleDropCopy` function was setting `baseDate` using `toISOString()` format instead of consistent YYYY-MM-DD format
- **Solution**: Changed to use `getDateKey()` utility for proper date format consistency across the application
- **Technical Details**: Ensured all task `baseDate` values use YYYY-MM-DD format for proper task-to-date mapping

### Drag and Drop Bug Fix
- **Issue Resolution**: Fixed critical bug where dragged tasks would be teleported to incorrect dates when conflicts occurred
- **Root Cause**: Global mouse up handler was using `getTodayDateKey()` instead of the task's actual original date for conflict reversion
- **Solution**: Added proper original date tracking in drag state to ensure tasks revert to their correct original positions
- **Affected Areas**: Task drag and drop, cross-day task movement, collision resolution system
- **Technical Details**: Enhanced `draggingTask` state to include `originalBaseDate` field for accurate conflict handling

### Pinned Tasks Time Display Fix
- **Issue Resolution**: Fixed timezone interpretation issues causing incorrect time displays in pinned tasks
- **Display Format**: Improved time formatting to show proper units (days, hours, minutes) instead of everything as minutes
- **Data Integrity**: Enhanced storage loading to reconstruct dates safely from baseDate + startHour
- **Defensive Programming**: Added type checking for Date objects vs strings throughout the codebase
- **Timeline Density**: Adjusted `PIXELS_PER_HOUR` from 210 to 205 for more compact timeline view

### Stability Improvements
- **Error Boundary Implementation**: Added global ErrorBoundary component to catch and handle JavaScript errors
- **Graceful Error Recovery**: Users can continue using the app even when individual components fail
- **Enhanced Error Logging**: Comprehensive error tracking for better debugging

### Performance Optimizations
- **Text Editor Performance**: Implemented memoized TextBlockComponent to prevent unnecessary re-renders
- **Component Optimization**: Enhanced React.memo usage across critical components
- **Bundle Size Reduction**: Optimized imports and enabled tree shaking

### UI/UX Enhancements
- **Calendar Improvements**: Modern design with better font clarity and eraser functionality
- **Modal Layering Fixes**: Resolved z-index conflicts with date pickers and modals
- **Compact UI**: Reduced modal sizes for better user experience

### Previous Updates
- **Project Editing**: Added ability to edit projects directly from the project detail page
- **Component Extraction**: Extracted `TaskCard` from `DailyPlanner` for better code organization
- **Modal Management**: Added dedicated `useModalManager` hook to centralize modal state and functions
- **Documentation**: Added JSDoc comments and README files across the codebase
- **Improved Type Safety**: Enhanced TypeScript type definitions and interfaces

### Goal Hierarchy
- Goal Hierarchy at `/goal-hierarchy` (main sidebar nav) — monthly goal summary; week tabs with inline Study Tracker toggle, week nav, and Open Notes; 7×2 weekly goals grid; daily goals use shared Weekly Goals cards synced with Calendar
- Calendar sidebar **Weekly Overview** link and legacy `/calendar?view=weekly-goals` redirect here
- Persists to `omega-planner-goal-hierarchy-v1` via `utils/goalHierarchyStorage.ts`

### Meals Page
- Meals page at `/meals` (hidden from main sidebar; Settings → Beta features) for meal names and ingredients.
- Left **Notes** panel: `components/meals/MealsNotesPanel.tsx` with `hooks/useMealsNotes.ts`.
- Persistence: `utils/mealsStorage.ts` (`omega-planner-meals-v1`). Legacy recipes import from `omega-planner-recipes` on first load.
- Notes: `utils/mealsNotesStorage.ts` (`omega-planner-meals-notes-v1`).

## Troubleshooting

If you encounter any issues:

1. **Application Errors**: The ErrorBoundary will catch most errors and provide a recovery option
2. Clear the cache:
```bash
npm run clean
```

3. Delete node_modules and reinstall:
```bash
rm -rf node_modules
npm install
```

4. Start fresh:
```bash
npm run dev:clean
```

## Development Guidelines

- **Error Handling**: All new components should consider error scenarios
- **Performance**: Use React.memo and useMemo for expensive operations
- **Type Safety**: Maintain strict TypeScript usage
- **Documentation**: Update relevant documentation files when making changes 