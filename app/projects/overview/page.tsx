'use client';

import React, { useState, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';
import { ProjectFolder } from '@/types';
import { AppLayout } from '@/components/ui/AppLayout';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Folder,
  FolderOpen,
  ArrowRight,
  Settings,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Lazy load the folder modal
const ProjectFolderFormModal = lazy(() => import('@/components/modals/ProjectFolderFormModal').then(module => ({ default: module.ProjectFolderFormModal })));

export default function ProjectsOverviewPage() {
  const router = useRouter();
  const { 
    projects, 
    folders, 
    loading, 
    createFolder, 
    updateFolder, 
    deleteFolder, 
    getProjectsInFolder 
  } = useProjects();
  
  // Modal state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ProjectFolder | null>(null);

  // Get ungrouped projects (projects not in any folder)
  const ungroupedProjects = projects.filter(p => !p.isDeleted && !p.folderId);

  // Folder management handlers
  const handleCreateFolder = () => {
    setEditingFolder(null);
    setIsFolderModalOpen(true);
  };

  const handleEditFolder = (folder: ProjectFolder) => {
    setEditingFolder(folder);
    setIsFolderModalOpen(true);
  };

  const handleCloseFolderModal = () => {
    setIsFolderModalOpen(false);
    setEditingFolder(null);
  };

  const handleSaveFolder = (folderData: Partial<ProjectFolder>, isNew: boolean) => {
    if (isNew) {
      createFolder(folderData as Omit<ProjectFolder, 'id' | 'createdAt' | 'updatedAt' | 'order'>);
    } else if (editingFolder) {
      updateFolder(editingFolder.id, folderData);
    }
    handleCloseFolderModal();
  };

  const handleDeleteFolder = (folderId: string) => {
    deleteFolder(folderId);
    handleCloseFolderModal();
  };

  const navigateToFolder = (folderId: string) => {
    router.push(`/projects?folder=${folderId}`);
  };

  const navigateToAllProjects = () => {
    router.push('/projects');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects Overview</h1>
            <p className="text-muted-foreground mt-2">Organize your projects into folders for better management</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={navigateToAllProjects}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View All
            </Button>
            <Button
              onClick={handleCreateFolder}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Folder
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Folders Section */}
          {folders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Project Folders
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folders.map(folder => {
                  const projectCount = getProjectsInFolder(folder.id).length;
                  return (
                    <div
                      key={folder.id}
                      className="group bg-card border border-border rounded-lg p-6 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-border/60"
                      onClick={() => navigateToFolder(folder.id)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full shadow-sm"
                            style={{ backgroundColor: folder.color }}
                          />
                          <FolderOpen className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditFolder(folder);
                          }}
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                          {folder.name}
                        </h3>
                        {folder.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {folder.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm text-muted-foreground">
                            {projectCount} project{projectCount !== 1 ? 's' : ''}
                          </span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ungrouped Projects Section */}
          {ungroupedProjects.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Folder className="w-5 h-5 text-muted-foreground" />
                Ungrouped Projects
              </h2>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-muted-foreground">
                    {ungroupedProjects.length} project{ungroupedProjects.length !== 1 ? 's' : ''} not organized into folders
                  </p>
                  <Button
                    onClick={() => navigateToAllProjects()}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Manage
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {ungroupedProjects.slice(0, 5).map(project => (
                    <div 
                      key={project.id}
                      className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <div 
                        className="w-3 h-3 rounded-full shadow-sm flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="text-sm font-medium text-foreground truncate">
                        {project.name}
                      </span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground ml-auto" />
                    </div>
                  ))}
                  
                  {ungroupedProjects.length > 5 && (
                    <div className="text-center pt-2">
                      <Button
                        onClick={() => navigateToAllProjects()}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                      >
                        +{ungroupedProjects.length - 5} more projects
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {folders.length === 0 && ungroupedProjects.length === 0 && (
            <div className="text-center py-16">
              <Folder className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Projects Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start organizing your work by creating folders and projects. Folders help you group related projects together.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleCreateFolder}
                  className="flex items-center gap-2"
                >
                  <Folder className="w-4 h-4" />
                  Create Folder
                </Button>
                <Button
                  onClick={() => router.push('/projects')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Project
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Folder Modal */}
      <Suspense fallback={null}>
        {isFolderModalOpen && (
          <ProjectFolderFormModal
            isOpen={isFolderModalOpen}
            onClose={handleCloseFolderModal}
            onSave={handleSaveFolder}
            folder={editingFolder}
            onDelete={handleDeleteFolder}
          />
        )}
      </Suspense>
    </AppLayout>
  );
} 