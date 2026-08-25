'use client';

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { ViewModeProvider } from '@/app/context/ViewModeContext';
import { CalendarViewProvider } from '@/app/context/CalendarViewContext';

const LEGACY_PROJECTS_KEY = 'omega-planner-projects';
const LEGACY_PROJECTS_WIPED_FLAG = 'omega-planner-projects-legacy-wiped';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      if (!localStorage.getItem(LEGACY_PROJECTS_WIPED_FLAG)) {
        localStorage.removeItem(LEGACY_PROJECTS_KEY);
        localStorage.setItem(LEGACY_PROJECTS_WIPED_FLAG, '1');
      }
    } catch {
      // Ignore storage errors (private mode, etc.)
    }
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={['light', 'dark', 'forest', 'dark-forest', 'midnight', 'system']}
      storageKey="omega-planner-theme"
      disableTransitionOnChange
    >
      <ViewModeProvider>
        <CalendarViewProvider>
          {children}
        </CalendarViewProvider>
      </ViewModeProvider>
    </ThemeProvider>
  );
}
