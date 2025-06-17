# Component Documentation

This document provides an overview of the project's component structure and documentation for individual components.

## Component Organization

The components in this project are organized into the following categories:

### `/components/ui`
Contains reusable UI components that form the building blocks of the application's interface. These components are designed to be generic and reusable across different features.

### `/components/planner`
Contains components specific to the planner functionality. These components are more specialized and tied to the planner feature.

### `/components/__tests__`
Contains component test files that ensure component functionality and behavior.

## Component Guidelines

### Best Practices
1. Keep components focused and single-responsibility
2. Use TypeScript interfaces to define prop types
3. Document component props and usage
4. Include unit tests in the `__tests__` directory
5. Follow the project's styling conventions

### Component Structure
Each component should follow this general structure:
```typescript
// Imports
import React from 'react';

// Types/Interfaces
interface ComponentProps {
  // prop definitions
}

// Component
export const Component: React.FC<ComponentProps> = ({ props }) => {
  // implementation
};
```

### Documentation Format
Each component should include:
- Description of its purpose
- Props interface with descriptions
- Usage examples
- Any important notes or caveats

## Available Components

### UI Components
Components in the `/components/ui` directory:
(To be documented as components are created/modified)

### Planner Components
Components in the `/components/planner` directory:
(To be documented as components are created/modified)

### Documents Components
Components in the `/components/documents` directory:

#### `Documents.tsx`
- **Purpose:** This component is the main interface for managing documents. It displays a list of documents, allows the user to create new documents, and provides an editor to modify the content of the selected document.
- **Functionality:**
    - View a list of all documents.
    - Create a new document.
    - Select a document to view and edit.
    - Delete a document permanently.
    - Move documents to trash/restore documents (trash acts as a recycle bin).
    - Star/unstar a document.
    - Search for documents by title or content.
    - Edit a document's title by double-clicking on it in the tab list.
    - Manual save button in the document controls for immediate saving.
    - Auto-save functionality that saves changes after 2 seconds of inactivity.
    - Trash view to manage trashed documents with restore/permanent delete options.
    - Navigation glitch prevention with debounced document selection.
- **Props:** This component does not accept any props.
- **Usage:**
  ```typescript
  import Documents from '@/components/documents/Documents';

  // ...
  <Documents />
  // ...
  ```

#### `CanvasTextEditor.tsx`
- **Purpose:** A canvas-based text editor that allows users to create independent text blocks positioned anywhere on the canvas.
- **Functionality:**
    - Double-click to create new text blocks anywhere on the canvas.
    - Drag mode for repositioning text blocks.
    - Edit mode for text input and editing.
    - Eraser function to clear all content with confirmation.
    - Spell check disabled for cleaner writing experience.
    - Delete individual text blocks in drag mode.
    - Undo functionality for recently deleted blocks.
- **Props:**
  - `content: string` - The editor content (JSON format)
  - `onChange: (content: string) => void` - Callback when content changes
  - `className?: string` - Additional CSS classes
  - `style?: React.CSSProperties` - Inline styles

## Adding New Components

When adding new components:
1. Create the component in the appropriate directory
2. Add TypeScript interfaces for props
3. Add necessary tests
4. Update this documentation
5. Follow the project's naming conventions 

## Layout Components

### AppLayout (`components/ui/AppLayout.tsx`)

The main layout wrapper component that provides the application structure.

**Features:**
- Fixed left sidebar navigation (256px width)
- Main content area with automatic left margin offset
- Consistent layout across all pages

**Usage:**
```tsx
import { AppLayout } from '@/components/ui/AppLayout';

export default function SomePage() {
  return (
    <AppLayout>
      <div className="p-6">
        {/* Page content */}
      </div>
    </AppLayout>
  );
}
```

### Navigation (`components/ui/Navigation.tsx`)

Left sidebar navigation component that provides app-wide navigation.

**Features:**
- Fixed positioning (w-64, full height)
- Branded header with Omega logo
- Navigation links with active state indicators
- Theme toggle functionality
- Modern styling with gradients and hover effects

**Navigation Items:**
- Daily Planner (`/`)
- Projects (`/projects`)
- Calendar (`/calendar`)
- Text Canvas (`/documents`)

**Styling Features:**
- Gradient backgrounds for active states
- Hover animations with scale effects
- Smooth transitions
- Shadow effects for depth
- Ring indicators for active items

## Planner Components

### DailyPlanner (`components/planner/DailyPlanner.tsx`)

The main planner interface component.

**Features:**
- Timeline view with hourly grid
- Task management (create, edit, delete, move)
- Drag and drop functionality
- Task pool sidebar
- Pinned tasks sidebar
- Time-based scheduling

### TaskCard (`components/planner/TaskCard.tsx`)

Individual task card component used in the timeline.

**Features:**
- Resizable and draggable
- Context menus
- Inline editing
- Status indicators
- Priority colors

### TaskPoolSidebar (`components/planner/TaskPoolSidebar.tsx`)

Sidebar for managing task templates and quick access tasks.

**Features:**
- Task template management
- Drag to timeline functionality
- Bulk operations

### PinnedTasksSidebar (`components/planner/PinnedTasksSidebar.tsx`)

Sidebar for displaying and managing pinned tasks.

**Features:**
- Quick access to important tasks
- Pin/unpin functionality
- Task status management

## Calendar Components

### YearCalendar (`components/calendar/YearCalendar.tsx`)

Full year calendar view with event management.

**Features:**
- Year overview with month grid
- Event creation and editing
- Period management
- Event highlighting

## Document Components

### CanvasTextEditor (`components/documents/CanvasTextEditor.tsx`)

Advanced text editor with canvas-like functionality.

**Features:**
- Rich text editing
- Performance optimizations
- Large document support
- Text block management

### Documents (`components/documents/Documents.tsx`)

Main documents interface component.

**Features:**
- Document list management
- Editor integration
- File operations

## Project Components

### ProjectCard (`components/projects/ProjectCard.tsx`)

Individual project card component.

**Features:**
- Project information display
- Progress indicators
- Quick actions
- Drag and drop support

### ProjectsCalendar (`components/projects/ProjectsCalendar.tsx`)

Calendar view for project timelines.

**Features:**
- Project timeline visualization
- Milestone tracking
- Date-based project view

## UI Components

### Primitive Components

The application uses various primitive UI components from `components/ui/`:

- **Button** - Styled button component with variants
- **Card** - Container component for content cards
- **Dialog** - Modal dialog component
- **Input** - Styled input component
- **Label** - Form label component
- **Select** - Dropdown select component
- **Calendar** - Date picker calendar
- **Popover** - Floating content container
- **Textarea** - Multi-line text input

### Custom Components

- **CustomTimePicker** - Time selection component
- **ErrorBoundary** - Error handling wrapper

## Modal Components

### ProjectFormModal (`components/modals/ProjectFormModal.tsx`)

Modal for creating and editing projects.

### ProjectTaskFormModal (`components/modals/ProjectTaskFormModal.tsx`)

Modal for creating and editing project tasks.

### TaskFormModal (`components/modals/TaskFormModal.tsx`)

Modal for creating and editing planner tasks.

## Component Guidelines

### Styling
- Use Tailwind CSS classes for styling
- Follow the established color palette
- Implement responsive design
- Support dark mode with `dark:` variants

### State Management
- Use custom hooks for complex state
- Leverage local storage for persistence
- Implement optimistic updates

### Performance
- Use React.lazy for code splitting
- Implement proper memoization
- Optimize re-renders with useCallback and useMemo

### Accessibility
- Include proper ARIA labels
- Support keyboard navigation
- Ensure color contrast compliance
- Implement focus management 