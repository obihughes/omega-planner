'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Project, ProjectFolder } from '@/types';
import { X, Calendar as CalendarIcon, Palette, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  folders?: ProjectFolder[];
  defaultFolderId?: string | undefined;
  onSave: (projectData: Partial<Project>, isNew: boolean) => void;
  onDelete?: (projectId: string) => void;
}

const PROJECT_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
];

const PROJECT_STATUSES: { value: Project['status']; label: string; color: string }[] = [
  { value: 'planning', label: 'Planning', color: 'text-purple-600' },
  { value: 'active', label: 'Active', color: 'text-blue-600' },
  { value: 'on-hold', label: 'On Hold', color: 'text-yellow-600' },
  { value: 'completed', label: 'Completed', color: 'text-green-600' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-red-600' },
];

export function ProjectFormModal({ isOpen, onClose, project, folders = [], defaultFolderId, onSave, onDelete }: ProjectFormModalProps) {
  const isNewProject = !project;
  const isSystemUnassigned = project?.id === 'unassigned';
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Project['status']>('planning');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [folderId, setFolderId] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setStatus(project.status);
      setColor(project.color);
      setFolderId(project.folderId);
      setStartDate(project.startDate ? new Date(project.startDate) : undefined);
      setEndDate(project.endDate ? new Date(project.endDate) : undefined);
    } else {
      // Reset for new project
      setName('');
      setDescription('');
      setStatus('planning');
      setColor(PROJECT_COLORS[0]);
      setFolderId(defaultFolderId);
      setStartDate(undefined);
      setEndDate(undefined);
    }

    if (isOpen && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus();
        if (isNewProject) {
          nameInputRef.current?.select();
        }
      }, 100);
    }
  }, [project, isOpen, isNewProject]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Do not close if a date picker is open or if the click is on a popover
      if (isStartDateOpen || isEndDateOpen || (event.target as HTMLElement).closest('[data-radix-popper-content-wrapper]')) {
        return;
      }
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
  }, [isOpen, onClose, isStartDateOpen, isEndDateOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') return;

    const projectData: Partial<Project> = {
      name: name.trim(),
      description: description.trim() || undefined,
      status,
      color,
      folderId,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    };

    onSave(projectData, isNewProject);
    onClose();
  };

  const handleDelete = () => {
    if (project && onDelete) {
      if (confirm('Archive this project? You can restore it later from the Archived view.')) {
        onDelete(project.id);
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
          <h2 className="text-xl font-semibold">
            {isNewProject ? 'Create New Project' : 'Edit Project'}
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

        <form 
          onSubmit={handleSave} 
          className="space-y-4"
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 'Enter') {
              e.preventDefault();
              handleSave(e as unknown as React.FormEvent);
            }
          }}
        >
          {/* Project Name */}
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-foreground mb-2">
              Project Name *
            </label>
            <input
              id="project-name"
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none text-foreground"
              placeholder="Enter project name..."
              required
              disabled={isSystemUnassigned}
            />
            {isSystemUnassigned && (
              <p className="mt-1 text-xs text-muted-foreground">This is the system project for tasks without a project. It cannot be renamed or deleted.</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="project-description" className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none text-foreground resize-none"
              placeholder="Project description..."
            />
          </div>

          {/* Status and Color Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label htmlFor="project-status" className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <select
                id="project-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Project['status'])}
                className="w-full p-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none text-foreground"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Folder */}
            <div>
              <label htmlFor="project-folder" className="block text-sm font-medium text-foreground mb-2">
                <Folder className="w-4 h-4 inline mr-1" />
                Folder
              </label>
              <select
                id="project-folder"
                value={folderId || ''}
                onChange={(e) => setFolderId(e.target.value || undefined)}
                className="w-full p-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none text-foreground"
                disabled={isSystemUnassigned}
              >
                <option value="">Unsorted Projects (No Folder)</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Color
              </label>
              <div className="grid grid-cols-5 gap-2">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-lg border-2 transition-all",
                      color === c 
                        ? "border-foreground scale-110" 
                        : "border-transparent hover:border-muted-foreground hover:scale-105"
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    title={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Start Date
              </label>
              <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? startDate.toLocaleDateString() : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 z-[1200]" 
                  align="start"
                  onInteractOutside={(e) => e.preventDefault()}
                >
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setIsStartDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Due Date
              </label>
              <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? endDate.toLocaleDateString() : "Select due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 z-[1200]" 
                  align="start"
                  onInteractOutside={(e) => e.preventDefault()}
                >
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setIsEndDateOpen(false);
                    }}
                    disabled={(date) => startDate ? date < startDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-border">
            <div>
              {!isNewProject && onDelete && !isSystemUnassigned && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Archive Project
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
                {isNewProject ? 'Create Project' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 