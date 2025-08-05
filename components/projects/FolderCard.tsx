'use client';

import React from 'react';
import { ProjectFolder } from '@/types';
import { Folder, MoreVertical, Edit, Trash2, ChevronDown, ChevronRight, Briefcase } from 'lucide-react';
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
  onToggleExpand?: (folderId: string, e: React.MouseEvent) => void;
  isExpanded?: boolean;
  projects?: any[];
  onProjectEdit?: (project: any) => void;
  onProjectDelete?: (projectId: string) => void;
  onProjectClick?: (project: any) => void;
  className?: string;
}

export function FolderCard({
  folder,
  projectCount,
  onEdit,
  onDelete,
  onClick,
  onMoveProjectToFolder,
  onToggleExpand,
  isExpanded = false,
  projects = [],
  onProjectEdit,
  onProjectDelete,
  onProjectClick,
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
        "relative group cursor-pointer transition-all duration-200",
        isOver && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
        className
      )}
      onClick={handleClick}
    >
      {/* Folder Card */}
      <div className="bg-card border border-border/60 p-3 hover:border-border transition-all duration-200 hover:shadow-sm aspect-square flex flex-col">
        {/* Header with folder icon and menu */}
        <div className="flex items-start justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div 
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: folder.color }}
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-foreground truncate text-sm">
                {folder.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {projectCount} {projectCount === 1 ? 'project' : 'projects'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {onToggleExpand && projectCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-70 hover:opacity-100 transition-opacity"
                onClick={(e) => onToggleExpand(folder.id, e)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </Button>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-3 h-3" />
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
        </div>

        {/* Expanded Projects View */}
        {isExpanded && projects.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <div className="flex flex-col gap-1 max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-muted/30 border border-border/40 p-1 hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    onProjectClick?.(project);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 flex-1">
                      <div 
                        className="w-1.5 h-1.5 flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <h4 className="text-xs font-medium text-foreground truncate flex-1 leading-3">
                        {project.name}
                      </h4>
                    </div>
                    <div className="text-xs text-muted-foreground leading-3 ml-2">
                      {project.progress}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drop Zone Indicator */}
        {isOver && (
          <div className="absolute inset-0 rounded-lg bg-primary/10 border-2 border-primary/50 border-dashed flex items-center justify-center">
            <div className="text-primary font-medium text-sm">
              Drop project here
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 