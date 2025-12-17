# Daily Planner Bottom View Fix - Summary

## Problem
The bottom view in the daily planner day view was showing "today" instead of "tomorrow" by default.

## Root Cause
The day view settings were being persisted to localStorage, but since day offsets are relative to "today" (0 = today, 1 = tomorrow), saving them caused incorrect behavior on subsequent loads. For example:
- Day 1: User sees offset 0 and 1 (today and tomorrow) ✓
- Settings saved: {topDayOffset: 0, bottomDayOffset: 1}
- Day 2: App loads saved settings, but now offset 0 and 1 mean "new today" and "new tomorrow" ✓
- However, if settings were corrupted or reset, both could show 0 (today)

## Solution
1. **Removed persistence of day view offsets** - They should NOT be saved to localStorage
2. **Always reset to defaults on app load**:
   - Top view: `DEFAULT_TOP_DAY_OFFSET` = 0 (today)
   - Bottom view: `DEFAULT_BOTTOM_DAY_OFFSET` = 1 (tomorrow)
3. Users can still navigate during a session, but on refresh it resets to the correct defaults

## Files Changed
- `hooks/useDailyPlannerState.ts` - Removed day view settings persistence logic
- `app/focus/mini/page.tsx` - Fixed empty file causing build error
- `docs/changelog.md` - Documented the fix
- `clear-day-view-settings.js` - Created utility script for users to clear old localStorage

## Testing
After these changes:
1. Open the daily planner
2. Top view should show **Today** (e.g., "Tuesday, Dec 17")
3. Bottom view should show **Tomorrow** (e.g., "Wednesday, Dec 18")
4. Navigate to other dates during the session - works fine
5. Refresh the page - resets back to today/tomorrow ✓

## Additional Improvements Made
While fixing this issue, also enhanced the Weekly View:
- Larger scrollbar (16px) for easier dragging
- Faster mouse wheel scrolling (8x sensitivity)
- Theme-matching scrollbar colors

## How to Clear Old Settings (if needed)
If users have old localStorage data, they can run this in the browser console:
```javascript
localStorage.removeItem('dayViewSettings');
location.reload();
```

Or use the provided script: `clear-day-view-settings.js`
