## Unreleased

- Branding
  - Added browser tab icon using Next.js file-based icon support.
  - File added: `app/icon.svg`. Replace this file to customize the favicon.

- Focus
  - Past Sessions list is hidden during an active session to reduce distraction. Files affected: `app/focus/page.tsx`.
  - Added collapsible Show/Hide for Past Sessions when no session is active; preference is persisted. Files affected: `app/focus/page.tsx`, `docs/components.md`, `README.md`.
  - Added session target length with quick-picks and custom minutes, plus progress bar, remaining time, and percentage. Persistence via `omega-planner-focus-target-seconds-v1`. Files affected: `app/focus/page.tsx`, `docs/components.md`, `README.md`.
  - Added optional sound notifications (5 minutes remaining, time up) with toggle and persistence via `omega-planner-focus-sound-enabled-v1`. Files affected: `app/focus/page.tsx`, `docs/components.md`, `README.md`.
  - Removed stray `secondsRemaining` reference from the Focus page.

- Navigation
  - Re-enable `Meals` in the main sidebar by default. Toggle visibility via `SHOW_MEALS_IN_NAV` in `lib/constants.ts` (default: true). Code and route remain intact.

- Projects / Tasks
  - Project task rows now always show the due date/time-until-due inline next to the task name. Hover is no longer required to see due information. Editing the due date remains a click on the chip; action buttons (clear date, expand subtasks, add subtask, edit, delete) still appear on hover to keep the layout minimal.
  - Files affected: `components/projects/TaskItem.tsx`, `utils/dateUtils.ts` (reuse only)
  - Due chip now shows the full formatted date on hover as `Weekday DD/MM/YYYY` (e.g., `Tuesday 15/05/2025`).

- Meals/Recipes
  - Added `RecipeFormModal` for creating/editing recipes with structured ingredient entry (name + quantity fields).
  - Integrated modal into `components/meals/RecipesSidebar.tsx` and enabled editing by clicking recipe names.
  - Fixed suggested recipes logic to compare against pantry items and list missing ingredients.
  - When adding a recipe to a meal slot, ingredients are now attached to the created meal so pantry matching works across Pantry/Shopping views.
  - Pantry/Recipes matching now normalizes ingredient names (trim, lowercase, simple plural strip) for robust matching.
  - Enhanced recipe suggestions with tiered matching: "Almost Ready" (75%+), "Good Match" (50-74%), "Partial Match" (25-49%).
  - Added visual match indicators throughout recipe lists with color-coded dots and ingredient counts.
  - Added pantry-based autocomplete for ingredient entry in recipe modal.
  
  Pantry
  - Structured input for pantry items (name, quantity, category) with inline editing in `PantrySidebar`.
  - Deduplicate and merge pantry items on add (normalize by name; update quantity/category if provided).
  - Deduplicate by normalized name on load (keep most recently updated) in `PantryStorage`.
  - Fixed infinite re-render loop causing storage to constantly save empty arrays.
  - Added deduplication guards to prevent saving identical data multiple times in rapid succession.
  - Improved storage reliability and performance for pantry and recipe persistence.
  - Added comprehensive debugging logs to all storage operations and UI interactions for troubleshooting.

## 2025-09-12

- Navigation order updated: moved `Focus` and `Meals` to the bottom of the main sidebar list. Files affected: `components/ui/Navigation.tsx`, `docs/components.md`.

- Focus page: Past Sessions redesigned to emphasize duration and show tasks as chips; dates are deemphasized with a compact time range and small day label. Files affected: `app/focus/page.tsx`.


