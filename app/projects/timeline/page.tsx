'use client';

import React from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import ProjectsTimeline from '@/components/projects/ProjectsTimeline';

export default function ProjectsTimelinePage() {
  return (
    <AppLayout>
      <div className="h-full p-4">
        <div className="h-full bg-background border border-border/60 rounded-lg overflow-hidden">
          <ProjectsTimeline />
        </div>
      </div>
    </AppLayout>
  );
}


