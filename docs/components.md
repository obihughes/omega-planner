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
    - Delete a document.
    - Star/unstar a document.
    - Search for documents by title or content.
    - Edit a document's title by double-clicking on it in the tab list.
    - Manual save button in the document editor header for immediate saving.
    - Auto-save functionality that saves changes after 2 seconds of inactivity.
- **Props:** This component does not accept any props.
- **Usage:**
  ```typescript
  import Documents from '@/components/documents/Documents';

  // ...
  <Documents />
  // ...
  ```

## Adding New Components

When adding new components:
1. Create the component in the appropriate directory
2. Add TypeScript interfaces for props
3. Add necessary tests
4. Update this documentation
5. Follow the project's naming conventions 