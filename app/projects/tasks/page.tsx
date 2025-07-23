'use client';

import { TaskListView } from '@/components/projects/TaskListView';
import { AppLayout } from '@/components/ui/AppLayout';

export default function ProjectsTasksPage() {
  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-6 h-full">
        <TaskListView className="h-full" />
      </div>
    </AppLayout>
  );
} 