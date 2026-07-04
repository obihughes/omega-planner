'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy route — redirects to /weekly-overview */
export default function GoalHierarchyRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/weekly-overview');
  }, [router]);

  return null;
}
