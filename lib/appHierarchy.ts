export type AppMapNodeKind =
  | 'area'
  | 'route'
  | 'page'
  | 'component'
  | 'hook'
  | 'context'
  | 'storage'
  | 'modal'
  | 'shell';

export type AppMapNode = {
  id: string;
  label: string;
  kind: AppMapNodeKind;
  path?: string;
  description?: string;
  editHint?: string;
  children?: AppMapNode[];
};

export const APP_MAP_LEGEND: { kind: AppMapNodeKind; label: string }[] = [
  { kind: 'area', label: 'Product area' },
  { kind: 'shell', label: 'App shell' },
  { kind: 'route', label: 'URL route' },
  { kind: 'page', label: 'Next.js page' },
  { kind: 'component', label: 'React component' },
  { kind: 'hook', label: 'Hook' },
  { kind: 'context', label: 'Context / provider' },
  { kind: 'storage', label: 'localStorage util' },
  { kind: 'modal', label: 'Shared modal' },
];

export const appHierarchy: AppMapNode[] = [
  {
    id: 'shell',
    label: 'App shell',
    kind: 'area',
    description: 'Layout, navigation, and global providers used on every page.',
    children: [
      {
        id: 'shell-layout',
        label: 'AppLayout',
        kind: 'shell',
        path: 'components/ui/AppLayout.tsx',
        editHint: 'Main content area margin and sidebar wrapper.',
      },
      {
        id: 'shell-nav',
        label: 'Navigation',
        kind: 'shell',
        path: 'components/ui/Navigation.tsx',
        editHint: 'Sidebar nav items; settings modal (theme, Beta features dialog for hidden routes, App Map). Hidden routes: lib/hiddenNavItems.ts.',
      },
      {
        id: 'shell-providers',
        label: 'Providers',
        kind: 'context',
        path: 'app/providers.tsx',
        editHint: 'Theme + ViewMode + ProjectsView + CalendarView + PlannerProvider + ProjectsProvider.',
      },
      {
        id: 'shell-root-layout',
        label: 'Root layout',
        kind: 'page',
        path: 'app/layout.tsx',
        editHint: 'HTML shell, fonts, global CSS import.',
      },
      {
        id: 'ctx-view-mode',
        label: 'ViewModeContext',
        kind: 'context',
        path: 'app/context/ViewModeContext.tsx',
        editHint: 'Planner daily / weekly / monthly view mode.',
      },
      {
        id: 'ctx-planner',
        label: 'PlannerProvider',
        kind: 'context',
        path: 'app/context/PlannerProvider.tsx',
        editHint: 'Core tasks, backlog, pinned tasks state.',
        children: [
          {
            id: 'ctx-planner-reducer',
            label: 'plannerReducer',
            kind: 'context',
            path: 'app/context/plannerReducer.ts',
          },
        ],
      },
      {
        id: 'ctx-projects',
        label: 'ProjectsProvider',
        kind: 'context',
        path: 'app/context/ProjectsProvider.tsx',
        editHint: 'Global projects, folders, and tasks; hydrates from localStorage once per session.',
      },
      {
        id: 'ctx-projects-view',
        label: 'ProjectsViewContext',
        kind: 'context',
        path: 'app/context/ProjectsViewContext.tsx',
        editHint: 'Projects page tabs: active, archived, calendar, tasks, today.',
      },
      {
        id: 'ctx-calendar-view',
        label: 'CalendarViewContext',
        kind: 'context',
        path: 'app/context/CalendarViewContext.tsx',
        editHint: 'Calendar monthly / yearly / timeline / weekly-goals modes.',
      },
      {
        id: 'ctx-sidebar',
        label: 'SidebarContext',
        kind: 'context',
        path: 'app/context/SidebarContext.tsx',
        editHint: 'Sidebar width and collapsed state.',
      },
      {
        id: 'hook-theme',
        label: 'useTheme',
        kind: 'hook',
        path: 'hooks/useTheme.ts',
        editHint: 'Light / dark / forest / dark-forest / midnight / system theme persistence.',
      },
    ],
  },
  {
    id: 'daily-planner',
    label: 'Daily Planner',
    kind: 'area',
    description: 'Timeline planner, weekly view, class schedule, month board.',
    children: [
      {
        id: 'dp-home',
        label: '/',
        kind: 'route',
        description: 'Home route. ?view=daily|weekly|monthly, ?date=YYYY-MM-DD',
      },
      {
        id: 'dp-page-home',
        label: 'Home page',
        kind: 'page',
        path: 'app/page.tsx',
        editHint: 'Lazy-loads DailyPlanner; syncs view from URL params.',
      },
      {
        id: 'dp-route-daily-planner',
        label: '/daily-planner',
        kind: 'route',
        description: 'Alias of / — same DailyPlanner component.',
      },
      {
        id: 'dp-page-daily-planner',
        label: 'Daily planner page',
        kind: 'page',
        path: 'app/daily-planner/page.tsx',
      },
      {
        id: 'dp-daily-planner',
        label: 'DailyPlanner',
        kind: 'component',
        path: 'components/planner/DailyPlanner.tsx',
        editHint: 'Main planner UI: timeline, sidebars, view switching.',
        children: [
          {
            id: 'dp-task-card',
            label: 'TaskCard',
            kind: 'component',
            path: 'components/planner/TaskCard.tsx',
            editHint: 'Timeline task drag, resize, styling.',
          },
          {
            id: 'dp-weekly-view',
            label: 'WeeklyView',
            kind: 'component',
            path: 'components/planner/WeeklyView.tsx',
            editHint: 'Weekly timeline on /. Not in sidebar — Settings → Beta features or /?view=weekly.',
          },
          {
            id: 'dp-edit-task',
            label: 'EditTaskModal',
            kind: 'component',
            path: 'components/planner/EditTaskModal.tsx',
          },
          {
            id: 'dp-inbox',
            label: 'TaskInboxSidebar',
            kind: 'component',
            path: 'components/planner/TaskInboxSidebar.tsx',
          },
        ],
      },
      {
        id: 'dp-hook',
        label: 'useDailyPlannerState',
        kind: 'hook',
        path: 'hooks/useDailyPlannerState.ts',
        editHint: 'Planner-specific UI state layered on PlannerProvider.',
      },
      {
        id: 'dp-hook-modal',
        label: 'useModalManager',
        kind: 'hook',
        path: 'hooks/useModalManager.ts',
        editHint: 'Central modal open/close for planner popups.',
      },
      {
        id: 'dp-storage',
        label: 'Task storage',
        kind: 'storage',
        path: 'utils/storage.ts',
        editHint: 'Tasks, pool, pinned tasks localStorage.',
      },
      {
        id: 'dp-class-schedule-route',
        label: '/class-schedule',
        kind: 'route',
      },
      {
        id: 'dp-class-schedule-page',
        label: 'Class schedule page',
        kind: 'page',
        path: 'app/class-schedule/page.tsx',
      },
      {
        id: 'dp-class-schedule',
        label: 'ClassSchedule',
        kind: 'component',
        path: 'components/planner/ClassSchedule.tsx',
        editHint: 'Weekly class grid UI.',
      },
      {
        id: 'dp-class-hook',
        label: 'useClassScheduleState',
        kind: 'hook',
        path: 'hooks/useClassScheduleState.ts',
      },
      {
        id: 'dp-class-storage',
        label: 'classScheduleStorage',
        kind: 'storage',
        path: 'utils/classScheduleStorage.ts',
      },
    ],
  },
  {
    id: 'calendar',
    label: 'Calendar',
    kind: 'area',
    description: 'Events calendar, weekly goals, timeline. Default: ?view=monthly.',
    children: [
      {
        id: 'cal-route',
        label: '/calendar',
        kind: 'route',
        description: '?view=monthly|yearly|timeline|weekly-goals',
      },
      {
        id: 'cal-page',
        label: 'Calendar page',
        kind: 'page',
        path: 'app/calendar/page.tsx',
        editHint: 'Switches calendar views; embeds Study Tracker in weekly-goals.',
      },
      {
        id: 'cal-monthly',
        label: 'MonthlyCalendar',
        kind: 'component',
        path: 'components/calendar/MonthlyCalendar.tsx',
        editHint: 'Default monthly events view.',
      },
      {
        id: 'cal-yearly',
        label: 'YearCalendar',
        kind: 'component',
        path: 'components/calendar/YearCalendar.tsx',
      },
      {
        id: 'cal-weekly-goals',
        label: 'WeeklyGoalsCalendarView',
        kind: 'component',
        path: 'components/calendar/WeeklyGoalsCalendarView.tsx',
        editHint: 'Weekly overview; inline switch to Study Tracker.',
      },
      {
        id: 'cal-checklist',
        label: 'ChecklistSidebar',
        kind: 'component',
        path: 'components/calendar/ChecklistSidebar.tsx',
        editHint: 'Weekly notes panel (Open Notes).',
      },
      {
        id: 'cal-period-modal',
        label: 'PeriodModal',
        kind: 'component',
        path: 'components/calendar/PeriodModal.tsx',
      },
      {
        id: 'cal-event-modal',
        label: 'EventModal',
        kind: 'component',
        path: 'components/calendar/EventModal.tsx',
      },
      {
        id: 'cal-hook',
        label: 'useCalendarData',
        kind: 'hook',
        path: 'hooks/useCalendarData.ts',
      },
      {
        id: 'cal-storage',
        label: 'goalsStorage',
        kind: 'storage',
        path: 'utils/goalsStorage.ts',
        editHint: 'Calendar events and weekly goals.',
      },
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    kind: 'area',
    children: [
      {
        id: 'proj-route',
        label: '/projects',
        kind: 'route',
      },
      {
        id: 'proj-layout',
        label: 'Projects layout',
        kind: 'shell',
        path: 'app/projects/layout.tsx',
        editHint: 'Shared AppLayout for list and detail; sidebar persists across navigation.',
      },
      {
        id: 'proj-page',
        label: 'Projects page',
        kind: 'page',
        path: 'app/projects/page.tsx',
        editHint: 'Folder grid, view mode tabs from ProjectsViewContext.',
      },
      {
        id: 'proj-route-detail',
        label: '/projects/[id]',
        kind: 'route',
      },
      {
        id: 'proj-page-detail',
        label: 'Project detail page',
        kind: 'page',
        path: 'app/projects/[id]/page.tsx',
      },
      {
        id: 'proj-card',
        label: 'ProjectCard',
        kind: 'component',
        path: 'components/projects/ProjectCard.tsx',
      },
      {
        id: 'proj-task-list',
        label: 'TaskListView',
        kind: 'component',
        path: 'components/projects/TaskListView.tsx',
      },
      {
        id: 'proj-calendar',
        label: 'ProjectsCalendar',
        kind: 'component',
        path: 'components/projects/ProjectsCalendar.tsx',
      },
      {
        id: 'proj-hook',
        label: 'useProjects',
        kind: 'hook',
        path: 'hooks/useProjects.ts',
        editHint: 'Consumer hook; reads from ProjectsProvider via useProjectsContext.',
      },
    ],
  },
  {
    id: 'documents',
    label: 'Text Documents',
    kind: 'area',
    children: [
      {
        id: 'doc-route',
        label: '/documents',
        kind: 'route',
      },
      {
        id: 'doc-page',
        label: 'Documents page',
        kind: 'page',
        path: 'app/documents/page.tsx',
      },
      {
        id: 'doc-component',
        label: 'Documents',
        kind: 'component',
        path: 'components/documents/Documents.tsx',
        editHint: 'Document list and canvas editor shell.',
        children: [
          {
            id: 'doc-editor',
            label: 'DocumentEditor',
            kind: 'component',
            path: 'components/documents/DocumentEditor.tsx',
          },
        ],
      },
      {
        id: 'doc-hook',
        label: 'useDocuments',
        kind: 'hook',
        path: 'hooks/useDocuments.ts',
      },
    ],
  },
  {
    id: 'visualizer',
    label: '5-Year Visualizer',
    kind: 'area',
    description: 'Main sidebar nav at bottom, after Text Documents.',
    children: [
      {
        id: 'viz-route',
        label: '/visualizer',
        kind: 'route',
      },
      {
        id: 'viz-page',
        label: 'Visualizer page',
        kind: 'page',
        path: 'app/visualizer/page.tsx',
      },
      {
        id: 'viz-component',
        label: 'FiveYearVisualizer',
        kind: 'component',
        path: 'components/visualizer/FiveYearVisualizer.tsx',
        editHint: 'Long-range period grid and drag-to-create.',
      },
      {
        id: 'viz-hook',
        label: 'useVisualizerData',
        kind: 'hook',
        path: 'hooks/useVisualizerData.ts',
      },
      {
        id: 'viz-storage',
        label: 'visualizerStorage',
        kind: 'storage',
        path: 'utils/visualizerStorage.ts',
      },
    ],
  },
  {
    id: 'meals',
    label: 'Meals (hidden nav)',
    kind: 'area',
    description: 'Not in sidebar — Settings → Beta features or /meals. Legacy /recipes redirects here.',
    children: [
      {
        id: 'meals-route',
        label: '/meals',
        kind: 'route',
      },
      {
        id: 'meals-page',
        label: 'Meals page',
        kind: 'page',
        path: 'app/meals/page.tsx',
      },
      {
        id: 'meals-redirect',
        label: '/recipes redirect',
        kind: 'page',
        path: 'app/recipes/page.tsx',
        editHint: 'Redirects to /meals for old bookmarks.',
      },
      {
        id: 'meals-view',
        label: 'MealsView',
        kind: 'component',
        path: 'components/meals/MealsView.tsx',
      },
      {
        id: 'meals-notes-panel',
        label: 'MealsNotesPanel',
        kind: 'component',
        path: 'components/meals/MealsNotesPanel.tsx',
        editHint: 'Left free-text notes rail; stacks above grid on small screens.',
      },
      {
        id: 'meals-hook',
        label: 'useMeals',
        kind: 'hook',
        path: 'hooks/useMeals.ts',
      },
      {
        id: 'meals-notes-hook',
        label: 'useMealsNotes',
        kind: 'hook',
        path: 'hooks/useMealsNotes.ts',
        editHint: 'Debounced scratchpad notes for the meals page.',
      },
      {
        id: 'meals-storage',
        label: 'mealsStorage',
        kind: 'storage',
        path: 'utils/mealsStorage.ts',
        editHint: 'Migrates legacy omega-planner-recipes on first load.',
      },
      {
        id: 'meals-notes-storage',
        label: 'mealsNotesStorage',
        kind: 'storage',
        path: 'utils/mealsNotesStorage.ts',
        editHint: 'Key omega-planner-meals-notes-v1 for page scratchpad text.',
      },
    ],
  },
  {
    id: 'study-tracker',
    label: 'Study Tracker (hidden nav)',
    kind: 'area',
    description: 'Not in sidebar — Settings → Beta features, /study-tracker, or embedded in /calendar weekly-goals.',
    children: [
      {
        id: 'st-route',
        label: '/study-tracker',
        kind: 'route',
      },
      {
        id: 'st-page',
        label: 'Study tracker page',
        kind: 'page',
        path: 'app/study-tracker/page.tsx',
      },
      {
        id: 'st-component',
        label: 'StudyTracker',
        kind: 'component',
        path: 'components/study-tracker/StudyTracker.tsx',
        editHint: 'Weekly day cards, monthly subject filter, subject management modal.',
      },
      {
        id: 'st-ctx',
        label: 'StudyTrackerContext',
        kind: 'context',
        path: 'app/context/StudyTrackerContext.tsx',
      },
      {
        id: 'st-hook',
        label: 'useStudyTracker',
        kind: 'hook',
        path: 'hooks/useStudyTracker.ts',
      },
      {
        id: 'st-storage',
        label: 'studyStorage',
        kind: 'storage',
        path: 'utils/studyStorage.ts',
      },
    ],
  },
  {
    id: 'month-board',
    label: 'Month Board (hidden nav)',
    kind: 'area',
    description: 'Not in sidebar — Settings → Beta features or /month-board. Month/week pickers with week goal + Mon–Sun day rows.',
    children: [
      {
        id: 'mb-route',
        label: '/month-board',
        kind: 'route',
      },
      {
        id: 'mb-page',
        label: 'Month board page',
        kind: 'page',
        path: 'app/month-board/page.tsx',
      },
      {
        id: 'mb-component',
        label: 'MonthBoard',
        kind: 'component',
        path: 'components/month-board/MonthBoard.tsx',
        editHint: 'Month/week pickers + single-week view; week goal + Mon–Sun day rows, DnD notes.',
      },
      {
        id: 'mb-storage',
        label: 'monthBoardStorage',
        kind: 'storage',
        path: 'utils/monthBoardStorage.ts',
        editHint: 'Key omega-planner-month-board-v1 (schema v2.0).',
      },
    ],
  },
  {
    id: 'goal-hierarchy',
    label: 'Goal Hierarchy',
    kind: 'area',
    description: 'Main sidebar nav at /goal-hierarchy. Multi-level goals: month → week → two-row day grid (Mon–Fri + Sat–Wed preview). Daily goals sync with Calendar weekly overview.',
    children: [
      {
        id: 'gh-route',
        label: '/goal-hierarchy',
        kind: 'route',
      },
      {
        id: 'gh-page',
        label: 'Goal hierarchy page',
        kind: 'page',
        path: 'app/goal-hierarchy/page.tsx',
      },
      {
        id: 'gh-component',
        label: 'GoalHierarchyView',
        kind: 'component',
        path: 'components/goal-hierarchy/GoalHierarchyView.tsx',
        editHint: 'Month tabs, week tabs, weekly panel, two 5-column day rows (Mon–Fri primary, Sat–Wed muted preview) with weekly goal cards synced to Calendar weekly overview.',
      },
      {
        id: 'gh-day-column',
        label: 'DayColumn',
        kind: 'component',
        path: 'components/goal-hierarchy/DayColumn.tsx',
        editHint: 'Single day card with weekly goal cards (+ button, drag/drop). Uses WeeklyGoalsListForDay and shared weekly goals storage.',
      },
      {
        id: 'gh-weekly-goals-list',
        label: 'WeeklyGoalsListForDay',
        kind: 'component',
        path: 'components/goal-hierarchy/WeeklyGoalsListForDay.tsx',
        editHint: 'Goal list + add form for one day; shared with Calendar weekly overview styling.',
      },
      {
        id: 'gh-day-textarea',
        label: 'DayGoalTextarea',
        kind: 'component',
        path: 'components/goal-hierarchy/DayGoalTextarea.tsx',
        editHint: 'Legacy plain-text day editor (deprecated for day grid; kept for reference).',
      },
      {
        id: 'gh-hook',
        label: 'useGoalHierarchy',
        kind: 'hook',
        path: 'hooks/useGoalHierarchy.ts',
        editHint: 'Month/week hierarchy state. Day goals are no longer stored here; use useWeeklyGoals for daily goals.',
      },
      {
        id: 'gh-weekly-goals-hook',
        label: 'useWeeklyGoals',
        kind: 'hook',
        path: 'hooks/useWeeklyGoals.ts',
        editHint: 'Shared weekly goals CRUD for Goal Hierarchy day grid and Calendar weekly overview. Key omega-planner-weekly-goals-v1.',
      },
      {
        id: 'gh-storage',
        label: 'goalHierarchyStorage',
        kind: 'storage',
        path: 'utils/goalHierarchyStorage.ts',
        editHint: 'Key omega-planner-goal-hierarchy-v1. Day goals are text-only in summary; legacy day items migrate on load.',
      },
    ],
  },
  {
    id: 'app-map',
    label: 'App Map (this page)',
    kind: 'area',
    children: [
      {
        id: 'am-route',
        label: '/app-map',
        kind: 'route',
        description: 'Reachable from Settings → Developer → App Map.',
      },
      {
        id: 'am-page',
        label: 'App map page',
        kind: 'page',
        path: 'app/app-map/page.tsx',
      },
      {
        id: 'am-view',
        label: 'AppMapView',
        kind: 'component',
        path: 'components/app-map/AppMapView.tsx',
      },
      {
        id: 'am-data',
        label: 'appHierarchy',
        kind: 'storage',
        path: 'lib/appHierarchy.ts',
        editHint: 'Update this file when adding routes or major features.',
      },
    ],
  },
  {
    id: 'shared-modals',
    label: 'Shared modals',
    kind: 'area',
    description: 'Cross-feature forms in components/modals/.',
    children: [
      {
        id: 'mod-task',
        label: 'TaskFormModal',
        kind: 'modal',
        path: 'components/modals/TaskFormModal.tsx',
      },
      {
        id: 'mod-quick-add',
        label: 'QuickAddTaskModal',
        kind: 'modal',
        path: 'components/modals/QuickAddTaskModal.tsx',
      },
      {
        id: 'mod-project',
        label: 'ProjectFormModal',
        kind: 'modal',
        path: 'components/modals/ProjectFormModal.tsx',
      },
      {
        id: 'mod-project-task',
        label: 'ProjectTaskFormModal',
        kind: 'modal',
        path: 'components/modals/ProjectTaskFormModal.tsx',
      },
      {
        id: 'mod-folder',
        label: 'ProjectFolderFormModal',
        kind: 'modal',
        path: 'components/modals/ProjectFolderFormModal.tsx',
      },
      {
        id: 'mod-meal',
        label: 'MealFormModal',
        kind: 'modal',
        path: 'components/modals/MealFormModal.tsx',
      },
      {
        id: 'mod-series',
        label: 'SeriesEditorModal',
        kind: 'modal',
        path: 'components/modals/SeriesEditorModal.tsx',
      },
    ],
  },
];
