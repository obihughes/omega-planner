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

## Adding New Components

When adding new components:
1. Create the component in the appropriate directory
2. Add TypeScript interfaces for props
3. Add necessary tests
4. Update this documentation
5. Follow the project's naming conventions 