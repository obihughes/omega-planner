## Habits View

### Name display
- Fixed name column width that accommodates most habit names properly.
- Wrap names toggle: when enabled, long habit names wrap instead of truncating.

### Timeframe selector
- Month: shows the current month.
- Quarter: shows the three months of the current quarter stacked.
- Year: shows all 12 months stacked.
- Navigation arrows still move the base month; for Quarter/Year, labels render for each month block.

### Quick interactions
- Click a day cell to cycle completion: none → partial → full → none.
- Use the per-habit quick add to set today to a specific state.

### Persistence
- UI preferences are stored in `localStorage` under key `omega-planner-habits-ui-v1`.

### Notes
- Opacity for a filled cell uses the selected state's opacity; empty cells render muted.

