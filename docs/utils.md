# Utility Functions Documentation

This document provides documentation for the utility functions available in the project.

## Available Utilities

### Formatters (`/utils/formatters.ts`)
Contains formatting utility functions for data transformation and display.

Functions:
- Date and time formatting
- Text formatting
- Number formatting
- Other data transformation utilities

### Storage (`/utils/storage.ts`)
Contains utilities for handling data storage and persistence.

Functions:
- Local storage operations
- Data caching
- State persistence helpers

## Usage Guidelines

### Best Practices
1. Keep utility functions pure when possible
2. Use TypeScript for type safety
3. Document function parameters and return types
4. Include usage examples in comments
5. Write unit tests for utilities

### Function Structure
```typescript
/**
 * Description of what the function does
 * @param paramName - Description of the parameter
 * @returns Description of the return value
 * @example
 * // Usage example
 * const result = utilityFunction(param);
 */
export function utilityFunction(param: ParamType): ReturnType {
  // implementation
}
```

## Adding New Utilities

When adding new utility functions:
1. Place them in the appropriate file based on functionality
2. If creating a new category, add a new file
3. Follow the TypeScript type system
4. Add JSDoc comments with examples
5. Update this documentation

## Testing Utilities

All utility functions should have corresponding test cases that:
1. Verify expected behavior
2. Test edge cases
3. Ensure type safety
4. Document usage examples

## Organization

Utilities are organized by their primary purpose:
- `formatters.ts` - Data formatting and transformation
- `storage.ts` - Data persistence and storage operations

When adding new utility files, follow the same pattern of grouping related functionality together. 