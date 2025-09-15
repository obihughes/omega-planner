'use client';

import { ThemeProvider } from 'next-themes';
import { PlannerProvider } from '@/app/context/PlannerProvider';
import { ViewModeProvider } from '@/app/context/ViewModeContext';
import { ProjectsViewProvider } from '@/app/context/ProjectsViewContext';
import { CalendarViewProvider } from '@/app/context/CalendarViewContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ViewModeProvider>
        <ProjectsViewProvider>
          <CalendarViewProvider>
            <PlannerProvider>
              {children}
            </PlannerProvider>
          </CalendarViewProvider>
        </ProjectsViewProvider>
      </ViewModeProvider>
    </ThemeProvider>
  );
} 