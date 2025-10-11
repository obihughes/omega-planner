'use client';

import React from 'react';
import { AppLayout } from '@/components/ui/AppLayout';

export default function BetaBoardsPage() {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-2">Board View (Beta)</h1>
        <p className="text-muted-foreground mb-6">A simple Kanban-style prototype. Non-functional placeholder.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Backlog', 'In Progress', 'Done'].map((col) => (
            <div key={col} className="border p-3">
              <div className="font-medium mb-3">{col}</div>
              <div className="space-y-2">
                <div className="border p-2 bg-card">Sample card A</div>
                <div className="border p-2 bg-card">Sample card B</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}


