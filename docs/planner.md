# Daily Planner Documentation

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