export type HiddenNavItem = {
  key: string;
  label: string;
  href: string;
  description: string;
};

export const HIDDEN_NAV_ITEMS: HiddenNavItem[] = [
  {
    key: 'recipes',
    label: 'Recipes',
    href: '/recipes',
    description: 'Pantry, shopping list, and recipes',
  },
  {
    key: 'study-tracker',
    label: 'Study Tracker',
    href: '/study-tracker',
    description: 'Weekly study planner (standalone)',
  },
];
