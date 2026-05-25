'use client';

import { AppLayout } from '@/components/ui/AppLayout';

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
