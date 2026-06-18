import { useTheme as useNextTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export const THEME_OPTIONS = ['light', 'dark', 'forest', 'dark-forest', 'midnight', 'system'] as const;
export type ThemeOption = (typeof THEME_OPTIONS)[number];

const DARK_THEMES = ['dark', 'dark-forest', 'midnight'] as const;

const THEME_CYCLE: ThemeOption[] = ['light', 'dark', 'forest', 'dark-forest', 'midnight'];

export const THEME_LABELS: Record<ThemeOption, string> = {
  light: 'Light',
  dark: 'Dark',
  forest: 'Forest',
  'dark-forest': 'Dark Forest',
  midnight: 'Midnight',
  system: 'System',
};

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const current = (resolvedTheme ?? theme ?? 'light') as ThemeOption;
    const cycleIndex = THEME_CYCLE.indexOf(current as (typeof THEME_CYCLE)[number]);
    const nextTheme =
      cycleIndex === -1
        ? THEME_CYCLE[0]
        : THEME_CYCLE[(cycleIndex + 1) % THEME_CYCLE.length];
    setTheme(nextTheme);
  };

  const isDark = DARK_THEMES.includes(resolvedTheme as (typeof DARK_THEMES)[number]);
  const isLight = resolvedTheme === 'light';
  const isForest = resolvedTheme === 'forest';
  const isDarkForest = resolvedTheme === 'dark-forest';
  const isMidnight = resolvedTheme === 'midnight';

  return {
    theme: mounted ? theme : undefined,
    resolvedTheme: mounted ? resolvedTheme : undefined,
    setTheme,
    toggleTheme,
    isDark,
    isLight,
    isForest,
    isDarkForest,
    isMidnight,
    mounted,
  };
}
