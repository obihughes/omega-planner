import { AppLayout } from '@/components/ui/AppLayout';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function BetaIndexPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-2">Beta</h1>
        <p className="text-muted-foreground mb-6">Quick links to experimental pages.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/beta/workspace" className={cn("border rounded-md p-4 hover:bg-accent/40 transition-colors")}>Workspace Today</Link>
          <Link href="/beta/habits" className={cn("border rounded-md p-4 hover:bg-accent/40 transition-colors")}>Habits</Link>
          <Link href="/beta/tasks" className={cn("border rounded-md p-4 hover:bg-accent/40 transition-colors")}>Tasks</Link>
          <Link href="/beta/tasks/weekly" className={cn("border rounded-md p-4 hover:bg-accent/40 transition-colors")}>Weekly Tasks</Link>
          <Link href="/projects?view=calendar" className={cn("border rounded-md p-4 hover:bg-accent/40 transition-colors")}>Projects Calendar</Link>
          <Link href="/beta/recipes" className={cn("border rounded-md p-4 hover:bg-accent/40 transition-colors")}>Recipes</Link>
        </div>
      </div>
    </AppLayout>
  );
}


