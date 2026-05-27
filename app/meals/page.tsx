'use client';

import { AppLayout } from '@/components/ui/AppLayout';
import { MealsView } from '@/components/meals';

export default function MealsPage() {
  return (
    <AppLayout>
      <MealsView />
    </AppLayout>
  );
}
