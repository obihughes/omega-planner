'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function BetaSearchPage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<string[]>([]);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-2">Unified Search (Beta)</h1>
        <p className="text-muted-foreground mb-6">Prototype search UI. Non-functional placeholder.</p>

        <div className="flex items-center gap-3 mb-6">
          <Input placeholder="Search everything..." value={q} onChange={(e) => setQ(e.target.value)} />
          <Button onClick={() => setResults(q ? ['Example match in Tasks', 'Example match in Projects'] : [])}>Search</Button>
        </div>

        <div className="border">
          {results.length === 0 ? (
            <div className="p-4 text-muted-foreground">No results</div>
          ) : (
            <ul className="divide-y">
              {results.map((r, i) => (
                <li key={i} className="p-3">{r}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppLayout>
  );
}


