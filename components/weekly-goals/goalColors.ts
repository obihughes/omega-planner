export const GOAL_COLORS = [
  { name: 'Red', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-700 dark:text-red-300', value: 'red' },
  { name: 'Orange', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-700 dark:text-orange-300', value: 'orange' },
  { name: 'Amber', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-700 dark:text-amber-300', value: 'amber' },
  { name: 'Yellow', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-700 dark:text-yellow-300', value: 'yellow' },
  { name: 'Lime', bg: 'bg-lime-500/10', border: 'border-lime-500/30', text: 'text-lime-700 dark:text-lime-300', value: 'lime' },
  { name: 'Green', bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-700 dark:text-green-300', value: 'green' },
  { name: 'Emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-300', value: 'emerald' },
  { name: 'Teal', bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-700 dark:text-teal-300', value: 'teal' },
  { name: 'Cyan', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-700 dark:text-cyan-300', value: 'cyan' },
  { name: 'Blue', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-700 dark:text-blue-300', value: 'blue' },
  { name: 'Indigo', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-700 dark:text-indigo-300', value: 'indigo' },
  { name: 'Violet', bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-700 dark:text-violet-300', value: 'violet' },
  { name: 'Purple', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-700 dark:text-purple-300', value: 'purple' },
  { name: 'Fuchsia', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', text: 'text-fuchsia-700 dark:text-fuchsia-300', value: 'fuchsia' },
  { name: 'Pink', bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-700 dark:text-pink-300', value: 'pink' },
  { name: 'Rose', bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-700 dark:text-rose-300', value: 'rose' },
  { name: 'Gray', bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-700 dark:text-gray-300', value: 'gray' },
  { name: 'Slate', bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-700 dark:text-slate-300', value: 'slate' },
  { name: 'Stone', bg: 'bg-stone-500/10', border: 'border-stone-500/30', text: 'text-stone-700 dark:text-stone-300', value: 'stone' },
  { name: 'Zinc', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', text: 'text-zinc-700 dark:text-zinc-300', value: 'zinc' },
] as const;

export type GoalColorValue = (typeof GOAL_COLORS)[number]['value'];

export function getGoalColorScheme(color?: string) {
  return GOAL_COLORS.find((c) => c.value === color) || GOAL_COLORS[16];
}
