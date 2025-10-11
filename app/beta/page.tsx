import { AppLayout } from '@/components/ui/AppLayout';

export default function BetaIndexPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-2">Beta</h1>
        <p className="text-muted-foreground mb-8">
          This is a placeholder page for experimental or upcoming features. 
          Use this space for notes, links, or previews you want to try out.
        </p>

        <div className="space-y-4 text-sm">
          <p>
            Add content here as needed. If a feature becomes stable, move it into the main app and remove it from Beta.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}


