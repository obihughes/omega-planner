'use client';

import React from 'react';
import { ProjectFolder } from '@/types';
import { Folder, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useDroppable } from '@dnd-kit/core';

interface FolderCardProps {
  folder: ProjectFolder;
  projectCount: number;
  onEdit: (folder: ProjectFolder) => void;
  onDelete: (folderId: string) => void;
  onClick: (folder: ProjectFolder) => void;
  onMoveProjectToFolder?: (projectId: string, folderId: string) => void;
  className?: string;
}

export function FolderCard({
  folder,
  projectCount,
  onEdit,
  onDelete,
  onClick,
  onMoveProjectToFolder,
  className
}: FolderCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-card-${folder.id}`,
    data: { type: 'folder', folderId: folder.id }
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(folder);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(folder);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this folder? Projects in this folder will be moved to "Unsorted Projects".')) {
      onDelete(folder.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg",
        isOver && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
        className
      )}
      onClick={handleClick}
    >
      {/* Folder Card */}
      <div className="bg-card/70 backdrop-blur-md rounded-2xl border border-border/40 p-6 shadow-lg hover:shadow-xl hover:ring-2 hover:ring-primary/20 hover:ring-offset-1 hover:ring-offset-background transition-all duration-300">
        {/* Header with folder icon and menu */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md ring-1 ring-white/10"
              style={{ backgroundColor: folder.color }}
            >
              <Folder className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg truncate max-w-[180px]">
                {folder.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {projectCount} {projectCount === 1 ? 'project' : 'projects'}
              </p>
            </div>
          </div>

          {/* Action Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-1">
              <div className="space-y-1">
                <button
                  onClick={handleEdit}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center space-x-2 rounded-md"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Folder</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center space-x-2 rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Folder</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Description */}
        {folder.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {folder.description}
          </p>
        )}

        {/* Drop Zone Indicator */}
        {isOver && (
          <div className="absolute inset-0 rounded-2xl bg-primary/10 border-2 border-primary/50 border-dashed flex items-center justify-center">
            <div className="text-primary font-medium text-sm">
              Drop project here
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 