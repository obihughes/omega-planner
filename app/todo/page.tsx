'use client';

import React from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { TodoView } from '@/components/todo';

export default function TodoPage() {
  return (
    <AppLayout>
      <div className="h-full w-full max-w-none">
        <TodoView />
      </div>
    </AppLayout>
  );
}
