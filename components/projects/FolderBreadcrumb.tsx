'use client';

import React from 'react';
import { ProjectFolder } from '@/types';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FolderBreadcrumbProps {
  currentFolder?: ProjectFolder;
  onNavigateToRoot: () => void;
  className?: string;
}

export function FolderBreadcrumb({
  currentFolder,
  onNavigateToRoot,
  className
}: FolderBreadcrumbProps) {
  return (
    <div className={cn("flex items-center gap-2 mb-6", className)}>
      {/* Root/Home button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onNavigateToRoot}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          !currentFolder 
            ? "bg-primary/10 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        <Home className="w-4 h-4" />
        All Projects
      </Button>

      {/* Current folder */}
      {currentFolder && (
        <>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: currentFolder.color }}
            />
            <span className="text-sm font-medium text-primary">
              {currentFolder.name}
            </span>
          </div>
        </>
      )}
    </div>
  );
} 