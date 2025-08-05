# Omega Planner Styling Guide

## Design Philosophy

Omega Planner follows a **sharp, minimalist design system** that emphasizes clean lines, geometric shapes, and professional aesthetics.

## Core Principles

### 1. Sharp Edges Only
- **No rounded corners** on any UI elements
- All cards, buttons, modals, and containers use sharp rectangular shapes
- This creates a modern, professional appearance

### 2. Clean Minimalism
- Reduced visual clutter
- Focus on functionality over decoration
- Clean typography and spacing

### 3. Consistent Geometry
- Rectangular cards and containers
- Sharp borders throughout
- Geometric precision in layouts

## Implementation Guidelines

### CSS Classes to Avoid
Never use these Tailwind classes:
```css
/* ❌ DO NOT USE */
.rounded-sm
.rounded-md  
.rounded-lg
.rounded-xl
.rounded-2xl
.rounded-full
```

### Preferred Alternatives
```css
/* ✅ USE INSTEAD */
.border          /* Sharp borders */
.border-border   /* Theme-aware borders */
.shadow-sm      /* Clean shadows without radius */
```

### Component Examples

#### Cards
```tsx
// ❌ Avoid
<div className="bg-card rounded-lg border p-4">

// ✅ Correct
<div className="bg-card border p-4">
```

#### Buttons
```tsx
// ❌ Avoid  
<button className="bg-primary text-white rounded-md px-4 py-2">

// ✅ Correct
<button className="bg-primary text-white px-4 py-2">
```

#### Modals
```tsx
// ❌ Avoid
<div className="bg-background border rounded-xl shadow-lg">

// ✅ Correct  
<div className="bg-background border shadow-lg">
```

## Global Configuration

### CSS Variables
```css
:root {
  --radius: 0; /* No global border radius */
}
```

### Scrollbars
```css
::-webkit-scrollbar-thumb {
  @apply bg-muted-foreground/20; /* Sharp scrollbar thumbs */
}
```

## Component-Specific Guidelines

### Calendar Components
- Day cells: Sharp rectangular grid
- Event cards: Clean rectangular shapes
- Navigation buttons: Sharp corners

### Project Cards  
- Main project cards: Sharp aspect-square containers
- Folder cards: Clean rectangular layout
- Task cards: Sharp borders, no rounded content

### Forms & Inputs
- Input fields: Sharp borders only
- Select dropdowns: Rectangular appearance
- Form containers: Clean rectangular forms

## Quality Checklist

Before submitting any component:

- [ ] No `rounded-*` classes used
- [ ] All borders are sharp and rectangular
- [ ] Component follows minimalist principles
- [ ] Consistent with existing components
- [ ] No custom border-radius in CSS

## Future Development

When creating new components:

1. **Start sharp**: Begin with rectangular shapes
2. **Question decoration**: Ask if visual elements are necessary
3. **Follow patterns**: Match existing component styles
4. **Test consistency**: Ensure component fits the overall design system

This guide ensures all Omega Planner components maintain the sharp, professional aesthetic that defines the application's visual identity.