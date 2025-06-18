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
- Task management with drag-and-drop
- Dark mode support
- Copy/paste tasks
- Time-based task organization
- Responsive design
- Task pool for unscheduled tasks
- Pinned tasks for quick access

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

### Pinned Tasks Time Display Fix (Latest)
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