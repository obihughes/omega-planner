## Habits View

### Visual Improvements
- **Enhanced UI**: Modern card-based design with rounded corners, shadows, and improved spacing
- **Day of week indicators**: Shows abbreviated day names (M, T, W, etc.) above date numbers with tooltips
- **Better today highlighting**: Current day is prominently highlighted with primary color background
- **Weekend differentiation**: Weekend days are visually distinguished with lighter text
- **Color indicators**: Each habit has a colored vertical bar showing its assigned color
- **Individual day boxes**: Distinct rounded boxes for each day with proper spacing
- **Hover effects**: Smooth scale and shadow animations on day cells for better interactivity
- **Better empty state**: Engaging empty state with icon and helpful message
- **Improved typography**: Better visual hierarchy with refined font sizes and weights

### Name Display
- Fixed name column width that accommodates most habit names properly
- Wrap names toggle: when enabled, long habit names wrap instead of truncating
- Click habit name to edit it inline with enhanced input styling

### Timeframe Selector
- **Month**: Shows the current month with full visual enhancements
- **Quarter**: Shows the three months of the current quarter stacked
- **Year**: Shows all 12 months stacked
- Navigation arrows move between time periods
- **Jump to Today**: Quick button to navigate back to current month

### Interactions
- **Click day cells** to cycle completion: none → partial → full → none
- **Hover effects**: Cells scale up on hover with smooth transitions
- **Better tooltips**: Show full date and completion state on hover
- **Enhanced modals**: 
  - Settings button opens clean modal for editing habit color and states
  - Delete button shows confirmation dialog to prevent accidental deletion

### Edit UX
- **Settings Modal**: Clean, organized modal for editing:
  - Color picker with live preview
  - State management with visual feedback
  - Level and opacity controls for each state
  - Easy add/remove state buttons
- **Delete Confirmation**: Modal dialog prevents accidental habit deletion
- **Inline name editing**: Click to edit with focus styles and keyboard shortcuts (Enter to save, Escape to cancel)

### Controls
- Improved controls bar with better visual hierarchy
- Enhanced dropdown menus with hover states
- Better checkbox styling for wrap names toggle

### Persistence
- UI preferences are stored in `localStorage` under key `omega-planner-habits-ui-v1`
- All habit data and completions persist across sessions

### Notes
- Opacity for a filled cell uses the selected state's opacity
- Empty cells render with low opacity muted color
- All transitions are smooth for a polished feel
- Responsive design adapts to different screen sizes

