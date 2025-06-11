# Text Canvas - Zone-Based Text Management

The Text Canvas implements a hybrid zone-based text management system that combines the flexibility of free-form positioning with the stability of independent text zones.

## How It Works

### Text Zones
- Text is automatically organized into independent "zones" 
- Zones are created when text sections are separated by **5 or more spaces**
- Each zone can be edited independently without affecting other zones
- Typing in one zone will not shift text in other zones

### Grid Positioning
- Text snaps to a virtual grid (every 4 characters) for consistent alignment
- Click anywhere to position text at that grid location
- New zones are created automatically when clicking in safe areas

### Safe Areas
- Areas that are at least 5 spaces away from existing text zones
- Prevents accidental text collision
- If you click too close to existing text, cursor moves to nearest safe position

## Key Features

### Independent Text Zones
```
Hello world     This is zone 1     Another zone here
    ^                ^                    ^
  Zone A           Zone B              Zone C
```
- Editing "Hello world" won't affect the other zones
- Each zone maintains its own position and content

### Smart Zone Detection
- Text separated by 5+ spaces becomes independent zones
- Zones on different lines are always independent
- Perfect for layouts, diagrams, and structured text

### Grid Snapping
- Text positions snap to 4-character boundaries
- Ensures consistent alignment across the document
- Maintains professional appearance

## Usage Examples

### Creating Independent Columns
```
Column 1          Column 2          Column 3
--------          --------          --------
Item A            Data X            Result 1
Item B            Data Y            Result 2
```

### Free-form Positioning
```
                    Title
                    
Left text                    Right text
                    
         Center text
```

### Code-like Layouts
```
function test() {        // Comment here
    let x = 5;          // Another comment
    return x;           // Final comment
}
```

## Technical Implementation

- **Zone Parsing**: Content is parsed into zones using regex `/\s{5,}/`
- **Grid System**: Positions snap to 4-character boundaries
- **Collision Detection**: Prevents text placement within 5 spaces of existing zones
- **Dynamic Updates**: Zones are recalculated on each edit for stability

## Benefits

1. **Stability**: Text sections remain independent
2. **Predictability**: Grid system ensures consistent positioning
3. **Flexibility**: Free-form positioning within safe areas
4. **Performance**: Efficient zone management with minimal overhead
5. **User Experience**: Natural editing behavior without unexpected text shifts