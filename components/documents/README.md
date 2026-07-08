# Text Canvas - Free-Form Text Editor

The Text Canvas provides a simple, intuitive interface for free-form text editing with absolute positioning. Users can place text anywhere on the canvas and move it around as needed.

## How It Works

### Simple Two-Step Workflow
1. **Click "Text" button** in the header toolbar
2. **Click anywhere on the canvas** where you want to place text
3. **Start typing** immediately

### Text Interaction
- **Edit Text**: Single-click any existing text block to start editing
- **Select Text**: Drag to highlight text when not in Move mode; use Ctrl+C / Ctrl+X / Ctrl+V to copy, cut, and paste
- **Move Text**: Enable "Move" mode in toolbar, then drag text blocks to new positions
- **Deselect**: Press `Escape` to deselect active text or cancel text addition mode

### Canvas Features
- **Free Positioning**: Place text anywhere on the infinite canvas
- **Grid Snapping**: Text automatically snaps to a grid for consistent alignment
- **Visual Feedback**: Active text blocks show blue border and indicator
- **Proper Scrolling**: Canvas scrolls vertically as needed, no horizontal expansion
- **Text Wrapping**: Long text wraps within reasonable bounds to prevent layout issues

## User Interface

### Header Controls
```
[Document Tabs] | [Text] [Move] | [★] [Archive] | [🔍] [+] [Archive View]
```

**Text Editing Tools** (when document is open):
- **Text**: Enter text addition mode - button highlights green when active
- **Move**: Enter drag mode - button highlights blue when active

**Document Actions**:
- **Star**: Mark document as favorite
- **Archive**: Move document to archive (can be restored later)

**Global Tools**:
- **Search**: Search through all documents
- **+**: Create new document
- **Archive View**: Toggle between active documents and archived documents

### Tab System
- **Open Documents**: Documents appear as tabs when opened
- **Close Tabs**: Click X on any tab to close it
- **Multiple Documents**: Keep multiple documents open simultaneously
- **Auto-Open**: New documents automatically open as tabs

## Key Features

### Intuitive Text Placement
```
Click "Text" → Click canvas location → Type immediately
```
No complex menus or multiple steps - just click where you want text to appear.

### Professional Layout Management
- Text blocks maintain their positions independently
- Grid snapping ensures consistent alignment
- Visual drag handles in Move mode
- Clean, distraction-free editing environment

### Smart Canvas Behavior
- **Responsive Width**: Canvas fits container width, prevents horizontal scrolling
- **Vertical Expansion**: Canvas grows vertically as needed for content
- **Text Wrapping**: Long text wraps instead of expanding page width
- **Zoom Friendly**: Works well at different zoom levels

## Usage Examples

### Simple Note Taking
```
                    Meeting Notes
                    =============
                    
Action Items:
- Review designs       Due: Friday
- Update documentation
- Schedule follow-up

Ideas:
• New feature concept
• UI improvements      Priority: High
• Performance fixes
```

### Diagram Creation
```
    Input → Processing → Output
      ↓         ↓         ↓
   Validate → Transform → Save
      ↓         ↓         ↓  
   Database ← Logic ← Display
```

### Flexible Layouts
```
Header Text                    Right Column Info
-----------                    -----------------

Left content area              • Point one
with multiple lines            • Point two
of information                 • Point three

       Center element

Footer notes here              Contact: email@example.com
```

## Technical Implementation

### Architecture
- **React Component**: Modern hooks-based implementation
- **State Management**: Efficient local state with auto-save
- **Grid System**: 4-pixel grid for consistent positioning
- **Storage**: JSON-based document persistence in localStorage

### Performance Features
- **Optimized Rendering**: Only re-renders changed text blocks
- **Debounced Saving**: Auto-save after 2 seconds of inactivity
- **Memory Efficient**: Minimal DOM manipulation
- **Responsive**: Smooth interaction even with many text blocks

### Layout Constraints
- **Width Control**: Text blocks limited to viewport width minus padding
- **Word Wrapping**: Automatic text wrapping with `word-wrap: break-word`
- **Container Bounds**: Canvas respects parent container dimensions
- **Scroll Management**: Vertical scrolling only, no horizontal expansion

## Benefits

1. **Simplicity**: Two-step workflow for text placement
2. **Flexibility**: Free-form positioning without restrictions
3. **Consistency**: Grid snapping maintains professional appearance
4. **Performance**: Smooth interaction with large documents
5. **Reliability**: No horizontal page expansion or layout breaking
6. **User Experience**: Intuitive controls with clear visual feedback

## Design Philosophy

The Text Canvas prioritizes **simplicity** and **predictability**:

- **Clear Workflow**: Always know how to add text (button → click → type)
- **Visual Feedback**: Clear indication of active modes and elements
- **No Surprises**: Canvas behaves predictably without unexpected changes
- **Professional Results**: Grid system ensures clean, aligned layouts
- **Focused Editing**: Clean interface without unnecessary complexity