# Daily Planner Component

The Daily Planner is the core component for task scheduling and timeline management.

## Features

### Drag and Drop
- **Task Movement**: Drag tasks between time slots and days
- **Collision Detection**: Automatically resolves overlaps when dropping tasks
- **Smart Positioning**: Tasks are positioned to avoid conflicts with existing tasks
- **Cross-Day Support**: Move tasks between different days while maintaining proper date tracking

### Recent Bug Fixes
- **Fixed Copy/Paste Rendering Issue**: Resolved bug where copied tasks wouldn't render until page reload by ensuring consistent YYYY-MM-DD date format in the `handleDropCopy` function
- **Fixed Date Tracking Issue**: Resolved bug where dragged tasks would be reverted to incorrect dates due to improper original date tracking in conflict resolution
- **Improved Collision Resolution**: Enhanced the drag and drop system to properly handle conflicts and date consistency

### Task Resize
- **Edge Resizing**: Resize tasks by dragging the start or end edges
- **Boundary Constraints**: Tasks are constrained within timeline boundaries
- **Collision Avoidance**: Resizing respects existing task positions

### Timeline Navigation
- **Multi-Day View**: View multiple days simultaneously
- **Time Periods**: Timeline is divided into night, morning, afternoon, and evening sections
- **Current Time Marker**: Visual indicator showing the current time on today's timeline

## Technical Implementation

### State Management
- Uses `useDailyPlannerState` hook for comprehensive state management
- Maintains separate states for dragging, resizing, and task data
- Implements proper date key tracking for cross-day operations

### Collision Resolution
- `resolveCollisionsForDrag`: Handles task positioning during drag operations
- Automatically finds available spaces when conflicts occur
- Maintains task spacing and timeline constraints

### Date Handling
- Uses YYYY-MM-DD format for consistent date representation
- Proper timezone-safe date calculations
- Tracks original task dates for accurate conflict resolution

## Components

### DailyPlanner
Main component that orchestrates all planner functionality.

### TimelineColumn
Renders individual timeline sections with tasks and time markers.

### TaskCard
Individual task representation with drag/resize handles.

## Usage

```typescript
import { DailyPlanner } from '@/components/planner';

export default function PlannerPage() {
  return <DailyPlanner />;
}
```

## Performance

- Memoized components for efficient re-rendering
- Optimized drag and drop with minimal state updates
- Efficient collision detection algorithms

## Daily Planner Documentation

## Overview
The Daily Planner is a core feature that allows users to manage and visualize their daily schedule across different time periods.

## Key Components

### DailyPlanner (`components/planner/DailyPlanner.tsx`)
Main component that handles the planner interface and logic.

#### Features
- Task management (create, edit, delete, copy)
- Drag-and-drop task positioning
- Task resizing
- Dark mode support
- Multi-day view (today and tomorrow)
- Time period sections (morning, afternoon, evening)

#### Task Properties
```typescript
interface Task {
  id: string;
  name: string;
  startHour: number;
  duration: number;
  dayOffset: number;
  color?: string;
}
```

#### Time Periods
- Morning: 4:00 AM - 11:00 AM
- Afternoon: 11:00 AM - 6:00 PM
- Evening: 6:00 PM - 1:00 AM

### TaskCard Component
Subcomponent that renders individual task cards with the following features:
- Task name display
- Duration display
- Color customization
- Edit/copy/delete actions
- Resize handles

## State Management
- Tasks are persisted using local storage
- Task positions and times are managed through internal state
- Dark mode preference is persisted across sessions

## Key Constants
```typescript
const TASK_HEIGHT = 56;
const TIMELINE_START_HOUR = 4;
const TIMELINE_END_HOUR = 25;
const MIN_TASK_DURATION = 0.25;
const PIXELS_PER_HOUR = 142;
```

## User Interactions
1. **Adding Tasks**
   - Double-click on timeline
   - Use "Add New Task" button
   
2. **Editing Tasks**
   - Click edit button on task
   - Modify name, color, or time
   
3. **Moving Tasks**
   - Drag and drop within timeline
   - Copy tasks between days
   
4. **Resizing Tasks**
   - Use left/right handles
   - Minimum duration: 15 minutes

5. **Scheduling Inbox/Unscheduled Tasks**
   - Drag tasks from the "Inbox" section (in monthly view) or "Unscheduled" tasks (in daily view) directly onto the calendar to assign them a specific time.

## Best Practices
1. Always check for task conflicts before placement
2. Use the provided color palette for consistency
3. Maintain task durations between 15 minutes and 7 hours
4. Keep task names concise for better display

## Troubleshooting
Common issues and solutions:
1. Task conflict: Ensure no overlapping times in same period
2. Drag issues: Check if task is properly released
3. Resize limits: Verify minimum/maximum duration constraints 