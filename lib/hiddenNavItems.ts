export type HiddenNavItem = {
  key: string;
  label: string;
  href: string;
  description: string;
};

export const HIDDEN_NAV_ITEMS: HiddenNavItem[] = [
  {
    key: 'meals',
    label: 'Meals',
    href: '/meals',
    description: 'Meals and ingredients',
  },
  {
    key: 'study-tracker',
    label: 'Study Tracker',
    href: '/study-tracker',
    description: 'Weekly study planner (standalone)',
  },
  {
    key: 'goal-hierarchy',
    label: 'Goal Hierarchy',
    href: '/goal-hierarchy',
    description: 'Monthly, weekly, and daily goal planning (experimental)',
  },
];
