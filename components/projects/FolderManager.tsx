'use client';

import React, { useState } from 'react';
import { ProjectFolder } from '@/types';
import { 
  Folder, 
  FolderOpen, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  MoreVertical 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface FolderManagerProps {
  folders: ProjectFolder[];
  onCreateFolder: () => void;
  onEditFolder: (folder: ProjectFolder) => void;
  onDeleteFolder: (folderId: string) => void;
  onToggleFolder: (folderId: string) => void;
  selectedFolderId?: string;
  onSelectFolder: (folderId: string | undefined) => void;
  className?: string;
}

interface FolderItemProps {
  folder: ProjectFolder;
  isSelected: boolean;
  projectCount: number;
  onEdit: (folder: ProjectFolder) => void;
  onDelete: (folderId: string) => void;
  onToggle: (folderId: string) => void;
  onSelect: (folderId: string) => void;
}

function FolderItem({ 
  folder, 
  isSelected, 
  projectCount, 
  onEdit, 
  onDelete, 
  onToggle, 
  onSelect 
}: FolderItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(folder.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(folder.id);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-md cursor-pointer group transition-all duration-200",
        isSelected 
          ? "bg-primary/10 border border-primary/20" 
          : "hover:bg-muted/50 border border-transparent"
      )}
      onClick={handleClick}
    >
      {/* Expand/Collapse Button */}
      <button
        onClick={handleToggle}
        className="flex-shrink-0 p-0.5 hover:bg-accent rounded transition-colors"
      >
        {folder.isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </button>

      {/* Folder Icon */}
      <div 
        className="flex-shrink-0"
        style={{ color: folder.color }}
      >
        {folder.isExpanded ? (
          <FolderOpen className="w-4 h-4" />
        ) : (
          <Folder className="w-4 h-4" />
        )}
      </div>

      {/* Folder Name and Project Count */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {folder.name}
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {projectCount}
          </span>
        </div>
        {folder.description && (
          <p className="text-xs text-muted-foreground truncate">
            {folder.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="p-1 hover:bg-accent rounded transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-3 h-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-0" align="end">
            <div className="py-1">
              <button
                onClick={() => onEdit(folder)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
              >
                <Edit className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={() => onDelete(folder.id)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2 text-destructive"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export function FolderManager({
  folders,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onToggleFolder,
  selectedFolderId,
  onSelectFolder,
  className
}: FolderManagerProps) {
  const [projectCounts, setProjectCounts] = useState<{ [key: string]: number }>({});

  // TODO: Get actual project counts from props or context
  // For now, using placeholder counts
  React.useEffect(() => {
    const counts: { [key: string]: number } = {};
    folders.forEach(folder => {
      counts[folder.id] = Math.floor(Math.random() * 10); // Placeholder
    });
    setProjectCounts(counts);
  }, [folders]);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">Folders</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreateFolder}
          className="h-6 w-6 p-0"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* All Projects Option */}
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-md cursor-pointer group transition-all duration-200",
          !selectedFolderId 
            ? "bg-primary/10 border border-primary/20" 
            : "hover:bg-muted/50 border border-transparent"
        )}
        onClick={() => onSelectFolder(undefined)}
      >
        <Folder className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm font-medium">All Projects</span>
      </div>

      {/* Folder List */}
      <div className="space-y-1">
        {folders.map(folder => (
          <FolderItem
            key={folder.id}
            folder={folder}
            isSelected={selectedFolderId === folder.id}
            projectCount={projectCounts[folder.id] || 0}
            onEdit={onEditFolder}
            onDelete={onDeleteFolder}
            onToggle={onToggleFolder}
            onSelect={onSelectFolder}
          />
        ))}
      </div>

      {folders.length === 0 && (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground mb-2">No folders yet</p>
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateFolder}
            className="text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Create Folder
          </Button>
        </div>
      )}
    </div>
  );
} 