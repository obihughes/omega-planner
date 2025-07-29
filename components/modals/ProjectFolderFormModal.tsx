'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ProjectFolder } from '@/types';
import { X, Palette, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProjectFolderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder?: ProjectFolder | null;
  onSave: (folderData: Partial<ProjectFolder>, isNew: boolean) => void;
  onDelete?: (folderId: string) => void;
}

// Folder color options (using hex colors for folders)
const FOLDER_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#A855F7', // Purple
  '#64748B', // Slate
  '#6B7280', // Gray
  '#059669', // Green
  '#DC2626'  // Dark Red
];

export function ProjectFolderFormModal({ isOpen, onClose, folder, onSave, onDelete }: ProjectFolderFormModalProps) {
  const isNewFolder = !folder;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setDescription(folder.description || '');
      setColor(folder.color);
    } else {
      // Reset for new folder
      setName('');
      setDescription('');
      setColor(FOLDER_COLORS[0]);
    }

    if (isOpen && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus();
        if (isNewFolder) {
          nameInputRef.current?.select();
        }
      }, 100);
    }
  }, [folder, isOpen, isNewFolder]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') return;

    const folderData: Partial<ProjectFolder> = {
      name: name.trim(),
      description: description.trim() || undefined,
      color,
    };

    onSave(folderData, isNewFolder);
    onClose();
  };

  const handleDelete = () => {
    if (folder && onDelete) {
      if (confirm('Are you sure you want to delete this folder? Projects in this folder will be moved to "Unsorted Projects".')) {
        onDelete(folder.id);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-lg border border-border text-foreground"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Folder className="w-5 h-5" />
            {isNewFolder ? 'Create New Folder' : 'Edit Folder'}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-accent"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Folder Name */}
          <div>
            <label htmlFor="folder-name" className="block text-sm font-medium text-foreground mb-2">
              Folder Name *
            </label>
            <input
              id="folder-name"
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none text-foreground"
              placeholder="Enter folder name..."
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="folder-description" className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              id="folder-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none text-foreground resize-none"
              placeholder="Enter folder description..."
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              <Palette className="w-4 h-4 inline mr-1" />
              Folder Color
            </label>
            <div className="grid grid-cols-8 gap-2">
              {FOLDER_COLORS.map((folderColor) => (
                <button
                  key={folderColor}
                  type="button"
                  onClick={() => setColor(folderColor)}
                  className={cn(
                    "w-8 h-8 rounded-lg border-2 transition-all hover:scale-110",
                    color === folderColor 
                      ? "border-foreground shadow-lg" 
                      : "border-border/30 hover:border-border/60"
                  )}
                  style={{ backgroundColor: folderColor }}
                  title={`Select ${folderColor}`}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-border">
            <div>
              {!isNewFolder && onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete Folder
                </Button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={name.trim() === ''}
              >
                {isNewFolder ? 'Create Folder' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 