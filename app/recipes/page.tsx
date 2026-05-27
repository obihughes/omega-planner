'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RecipesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/meals');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      Redirecting to meals...
    </div>
  );
}
