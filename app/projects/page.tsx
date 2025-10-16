'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';
import { Project, ProjectFolder, ProjectTask } from '@/types';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectsCalendar } from '@/components/projects/ProjectsCalendar';
import { FolderCard } from '@/components/projects/FolderCard';
import { FolderBreadcrumb } from '@/components/projects/FolderBreadcrumb';
import { UpcomingTasksTimeline } from '@/components/planner/UpcomingTasksTimeline';

import { AppLayout } from '@/components/ui/AppLayout';
import { useProjectsView } from '@/app/context/ProjectsViewContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Archive,
  Calendar,
  ChevronDown,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Home,
  GripVertical,
  FolderPlus
} from 'lucide-react';

// Drag and drop imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';

// Lazy load the modals to reduce initial bundle size
const ProjectFormModal = lazy(() => import('@/components/modals/ProjectFormModal').then(module => ({ default: module.ProjectFormModal })));
const ProjectFolderFormModal = lazy(() => import('@/components/modals/ProjectFolderFormModal').then(module => ({ default: module.ProjectFolderFormModal })));
const ProjectTaskFormModal = lazy(() => import('@/components/modals/ProjectTaskFormModal').then(module => ({ default: module.ProjectTaskFormModal })));

// Sortable Project Card wrapper
function SortableProjectCard({ 
  project, 
  onEdit, 
  onDelete, 
  onRestore, 
  onPermanentlyDelete, 
  onClone,
  onClick, 
  isArchived,
  folders,
  onMoveToFolder,
  onQuickAddTask,
  onQuickChangeStatus,
  onQuickChangeColor,
  onQuickChangeDueDate
}: {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onRestore?: (projectId: string) => void;
  onPermanentlyDelete?: (projectId: string) => void;
  onClone?: (project: Project) => void;
  onClick: (project: Project) => void;
  isArchived?: boolean;
  folders?: ProjectFolder[];
  onMoveToFolder?: (projectId: string, folderId: string | undefined) => void;
  onQuickAddTask?: (projectId: string) => void;
  onQuickChangeStatus?: (projectId: string, status: Project['status']) => void;
  onQuickChangeColor?: (projectId: string, color: string) => void;
  onQuickChangeDueDate?: (projectId: string, endDate: string | undefined) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  return (
    <ProjectCard
      project={project}
      onEdit={onEdit}
      onDelete={onDelete}
      onRestore={onRestore}
      onPermanentlyDelete={onPermanentlyDelete}
      onClone={onClone}
      onClick={onClick}
      isArchived={isArchived}
      folders={folders}
      onMoveToFolder={onMoveToFolder}
      isDragging={isDragging}
      transform={transform}
      listeners={listeners}
      attributes={attributes}
      setNodeRef={setNodeRef}
      onQuickAddTask={onQuickAddTask}
      onQuickChangeStatus={onQuickChangeStatus}
      onQuickChangeColor={onQuickChangeColor}
      onQuickChangeDueDate={onQuickChangeDueDate}
    />
  );
}

function ProjectsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    projects, 
    folders,
    loading, 
    createProject, 
    cloneProject,
    updateProject, 
    deleteProject, 
    restoreProject,
    permanentlyDeleteProject,
    reorderProjects,
    addTaskToProject,
    createFolder,
    updateFolder,
    deleteFolder,
    toggleFolder,
    getProjectsInFolder,
    moveProjectToFolder
  } = useProjects();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Project['status'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'updated' | 'order'>('order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { viewMode: activeView, setViewMode: setActiveView } = useProjectsView();
  
  // Project form modal state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Task modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskProjectId, setTaskProjectId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  
  // Folder form modal state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ProjectFolder | null>(null);
  
  // Selected folder for filtering
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
  
  // Expanded folders state - start with all folders expanded by default
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // Get current folder object for breadcrumb
  const currentFolder = selectedFolderId ? folders.find(f => f.id === selectedFolderId) : undefined;

  // Handle folder URL parameter
  useEffect(() => {
    const folderParam = searchParams.get('folder');
    if (folderParam && folders.some(f => f.id === folderParam)) {
      setSelectedFolderId(folderParam);
    }
  }, [searchParams, folders]);

  // Handle view URL parameter (?view=active|archived|calendar)
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'active' || viewParam === 'archived' || viewParam === 'calendar') {
      setActiveView(viewParam as any);
    }
  }, [searchParams, setActiveView]);

  // Set all folders as expanded by default when folders load
  useEffect(() => {
    if (folders.length > 0) {
      setExpandedFolders(new Set(folders.map(f => f.id)));
    }
  }, [folders]);

  // Drag and drop state
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Create sample projects and folders if none exist
  useEffect(() => {
    if (!loading && projects.length === 0) {
      // Create sample folders first
      const workFolder = createFolder({
        name: 'Work Projects',
        description: 'Professional and business-related projects',
        color: '#3B82F6'
      });
      
      const personalFolder = createFolder({
        name: 'Personal',
        description: 'Personal goals and side projects',
        color: '#10B981'
      });
      
      const clientsFolder = createFolder({
        name: 'Client Work',
        description: 'Projects for external clients',
        color: '#F59E0B'
      });
      // Create sample projects with tasks
      const websiteProject = createProject({
        name: 'Website Redesign',
        description: 'Complete overhaul of the company website with modern design and improved UX',
        status: 'active',
        color: '#3B82F6',
        startDate: '2024-01-15',
        endDate: '2024-03-15',
        folderId: workFolder.id
      });
      
      const mobileProject = createProject({
        name: 'Mobile App Development',
        description: 'Native mobile application for iOS and Android platforms',
        status: 'planning',
        color: '#10B981',
        startDate: '2024-02-01',
        endDate: '2024-06-01',
        folderId: personalFolder.id
      });
      
      const marketingProject = createProject({
        name: 'Marketing Campaign',
        description: 'Q1 digital marketing campaign across social media and search platforms',
        status: 'completed',
        color: '#F59E0B',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        folderId: clientsFolder.id
      });

      // Add sample tasks to projects
      setTimeout(() => {
        // Website project tasks
        addTaskToProject(websiteProject.id, {
          title: 'Design wireframes',
          description: 'Create wireframes for all main pages',
          status: 'completed',
          priority: 'high',
          dueDate: '2024-01-25',
          estimatedHours: 16
        });

        addTaskToProject(websiteProject.id, {
          title: 'Develop homepage',
          description: 'Code the new homepage with responsive design',
          status: 'in-progress',
          priority: 'high',
          dueDate: '2024-02-10',
          estimatedHours: 24
        });

        addTaskToProject(websiteProject.id, {
          title: 'Content migration',
          description: 'Migrate existing content to new structure',
          status: 'todo',
          priority: 'medium',
          dueDate: '2024-02-20',
          estimatedHours: 12
        });

        // Mobile project tasks
        addTaskToProject(mobileProject.id, {
          title: 'Market research',
          description: 'Research competitor apps and user needs',
          status: 'completed',
          priority: 'high',
          estimatedHours: 20
        });

        addTaskToProject(mobileProject.id, {
          title: 'UI/UX Design',
          description: 'Design user interface and experience mockups',
          status: 'in-progress',
          priority: 'high',
          estimatedHours: 30
        });

        // Marketing campaign tasks
        addTaskToProject(marketingProject.id, {
          title: 'Define target audience',
          description: 'Create detailed personas for the target audience',
          status: 'completed',
          priority: 'high',
          estimatedHours: 8
        });
      }, 100);
    }
  }, [loading, projects.length, createFolder]);


  const activeProjects = projects
    .filter(p => !p.isDeleted)
    .filter(p => {
      if (statusFilter === 'all') return true;
      return p.status === statusFilter;
    })
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(p => {
      // Filter by folder if one is selected
      if (selectedFolderId !== undefined) {
        return p.folderId === selectedFolderId;
      }
      // When no folder is selected, show only projects that are NOT in folders
      return !p.folderId;
    });

  const archivedProjects = projects
    .filter(p => p.isDeleted)
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleCreateProject = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
  };

  const handleProjectClick = (project: Project) => {
    router.push(`/projects/${project.id}`);
  };

  const handleProjectClickById = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  // Handle folder navigation in main content area
  const handleFolderClick = (folder: ProjectFolder) => {
    setSelectedFolderId(folder.id);
    router.push(`/projects?folder=${folder.id}`);
  };

  const handleToggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  // Handle navigation back to root
  const handleNavigateToRoot = () => {
    setSelectedFolderId(undefined);
    router.push('/projects');
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const handleCloneProject = (project: Project) => {
    cloneProject(project);
  };

  const handleDeleteProject = (projectId: string) => {
    deleteProject(projectId);
  };

  const handleRestoreProject = (projectId: string) => {
    restoreProject(projectId);
  };

  const handlePermanentlyDeleteProject = (projectId: string) => {
    permanentlyDeleteProject(projectId);
  };

  const handleSaveProject = (projectData: Partial<Project>, isNew: boolean) => {
    if (isNew) {
      createProject({
        name: projectData.name || 'New Project',
        description: projectData.description || '',
        status: projectData.status || 'planning',
        color: projectData.color || '#CCCCCC',
        folderId: projectData.folderId
      });
    } else {
      updateProject(editingProject!.id, projectData);
    }
  };

  const handleCloseModal = () => {
    setIsProjectModalOpen(false);
    setEditingProject(null);
  };

  // Folder modal handlers
  const handleCreateFolder = () => {
    setEditingFolder(null);
    setIsFolderModalOpen(true);
  };

  const handleEditFolder = (folder: ProjectFolder) => {
    setEditingFolder(folder);
    setIsFolderModalOpen(true);
  };

  const handleDeleteFolder = (folderId: string) => {
    deleteFolder(folderId);
    if (selectedFolderId === folderId) {
      setSelectedFolderId(undefined);
    }
  };

  const handleSaveFolder = (folderData: Partial<ProjectFolder>, isNew: boolean) => {
    if (isNew) {
      createFolder({
        name: folderData.name || 'New Folder',
        description: folderData.description || '',
        color: folderData.color || '#3B82F6'
      });
    } else {
      updateFolder(editingFolder!.id, folderData);
    }
  };

  const handleCloseFolderModal = () => {
    setIsFolderModalOpen(false);
    setEditingFolder(null);
  };

  const getProjectCountForFolder = (folderId: string | undefined) => {
    return getProjectsInFolder(folderId).length;
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Check if dropping on a folder
      if (over.data?.current?.type === 'folder') {
        const projectId = active.id as string;
        const folderId = over.data.current.folderId;
        moveProjectToFolder(projectId, folderId);
      } else {
        // Regular project reordering
        reorderProjects(active.id as string, over.id as string);
      }
    }
    setActiveId(null);
  }

  const activeProject = activeId ? projects.find(p => p.id === activeId) : null;

  const handleQuickAddTask = (projectId: string) => {
    // Open the full task form modal for creation instead of auto-adding
    setTaskProjectId(projectId);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: Partial<ProjectTask>, isNew: boolean) => {
    if (!taskProjectId) return;
    // Persist the newly created task to the selected project
    addTaskToProject(taskProjectId, {
      title: taskData.title || 'New task',
      description: taskData.description || '',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      startDate: taskData.startDate,
      dueDate: taskData.dueDate,
      estimatedHours: taskData.estimatedHours,
      actualHours: taskData.actualHours,
      tags: taskData.tags,
      assignedTo: taskData.assignedTo,
      completedAt: taskData.completedAt,
    });
  };

  const handleQuickChangeStatus = (projectId: string, status: Project['status']) => {
    updateProject(projectId, { status });
  };

  const handleQuickChangeColor = (projectId: string, color: string) => {
    updateProject(projectId, { color });
  };

  const handleQuickChangeDueDate = (projectId: string, endDate: string | undefined) => {
    updateProject(projectId, { endDate });
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-6">
          {/* Main Content Area */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-6">
                <h1 className="text-2xl font-semibold text-foreground">
                  {currentFolder ? currentFolder.name : 'All Projects'}
                </h1>
                <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
                  <TabsList className="bg-muted/50 border-0">
                    <TabsTrigger value="active" className="text-sm">Active</TabsTrigger>
                    <TabsTrigger value="archived" className="text-sm">Archived</TabsTrigger>
                    <TabsTrigger value="calendar" className="text-sm">Calendar</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
          <div className="flex items-center space-x-3">
            
            <Input
              type="search"
              placeholder="Search projects..."
              className="w-56 h-9 text-sm border-border/60"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <Popover>
              <PopoverTrigger asChild>
                <button className="px-3 py-2 rounded-md border border-border/60 hover:border-border text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-2">
                  <span>View</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64">
                <div className="space-y-4 p-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Status</h4>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="w-full p-2 bg-background border border-input rounded-lg"
                    >
                      <option value="all">All</option>
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="on-hold">On Hold</option>
                    </select>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2">Sort by</h4>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full p-2 bg-background border border-input rounded-lg mb-2"
                    >
                      <option value="order">Custom Order</option>
                      <option value="name">Name</option>
                      <option value="progress">Progress</option>
                      <option value="updated">Last Updated</option>
                    </select>
                    <div className="flex items-center space-x-1 border rounded-lg p-1 bg-muted/50">
                      <button 
                        onClick={() => setSortOrder('asc')} 
                        className={`flex-1 p-2 rounded-md transition-colors text-sm flex items-center justify-center ${sortOrder === 'asc' ? 'bg-primary text-primary-foreground' : ''}`}
                      >
                        <SortAsc className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setSortOrder('desc')} 
                        className={`flex-1 p-2 rounded-md transition-colors text-sm flex items-center justify-center ${sortOrder === 'desc' ? 'bg-primary text-primary-foreground' : ''}`}
                      >
                        <SortDesc className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2">Display</h4>
                    <div className="flex items-center space-x-1 border rounded-lg p-1 bg-muted/50">
                      <button onClick={() => setViewMode('grid')} className={`flex-1 p-2 rounded-md transition-colors text-sm ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''}`}>Grid</button>
                      <button onClick={() => setViewMode('list')} className={`flex-1 p-2 rounded-md transition-colors text-sm ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}`}>List</button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <button
              onClick={handleCreateFolder}
              className="px-3 py-2 rounded-md border border-border/60 hover:border-border text-sm transition-colors flex items-center space-x-2"
            >
              <FolderPlus className="w-4 h-4" />
              <span>New Folder</span>
            </button>

            <button
              onClick={handleCreateProject}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:bg-primary/90 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          </div>
            </div>

            {/* Projects View */}
          {activeView === 'active' && (
            <>
              {/* Breadcrumb Navigation */}
              <FolderBreadcrumb
                currentFolder={currentFolder}
                onNavigateToRoot={handleNavigateToRoot}
              />

              {/* Empty state when inside a folder with no projects */}
              {activeProjects.length === 0 && selectedFolderId && (
                <div className="text-center py-12">
                  <div className="text-muted-foreground mb-4">
                    No projects in this folder yet
                  </div>
                  <button
                    onClick={handleCreateProject}
                    className="btn-primary px-6 py-3 rounded-lg inline-flex items-center space-x-2 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Project in This Folder</span>
                  </button>
                </div>
              )}

              {/* Empty state for root view when no folders or projects */}
              {!selectedFolderId && folders.length === 0 && activeProjects.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all' ? 'No projects match your filters' : 'No projects or folders yet'}
                  </div>
                  {!searchTerm && statusFilter === 'all' && (
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleCreateProject}
                        className="btn-primary px-6 py-3 rounded-lg inline-flex items-center space-x-2 font-medium"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Create Your First Project</span>
                      </button>
                      <button
                        onClick={handleCreateFolder}
                        className="btn-secondary px-6 py-3 rounded-lg inline-flex items-center space-x-2 font-medium"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Create Folder</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Custom Order Indicator */}
              {sortBy === 'order' && (activeProjects.length > 0 || (folders.length > 0 && !selectedFolderId)) && (
                <div className="mb-6 p-3 bg-muted/30 border border-border/40 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GripVertical className="w-4 h-4" />
                    <span>Drag to reorder projects</span>
                  </div>
                </div>
              )}

              {/* Main content area - folders and projects */}
              {(activeProjects.length > 0 || (folders.length > 0 && !selectedFolderId)) && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={activeProjects.map(p => p.id)} 
                    strategy={verticalListSortingStrategy}
                  >
                    <div className={
                      viewMode === 'grid' 
                        ? "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 items-start"
                        : "space-y-4"
                    }>
                      {/* Render folders when in root view */}
                      {!selectedFolderId && folders.map((folder) => (
                        <React.Fragment key={folder.id}>
                          <FolderCard
                            folder={folder}
                            projectCount={getProjectsInFolder(folder.id).length}
                            onEdit={handleEditFolder}
                            onDelete={handleDeleteFolder}
                            onClick={handleFolderClick}
                            onMoveProjectToFolder={moveProjectToFolder}
                            onToggleExpand={handleToggleFolder}
                            isExpanded={expandedFolders.has(folder.id)}
                            projects={getProjectsInFolder(folder.id)}
                            onProjectEdit={handleEditProject}
                            onProjectDelete={handleDeleteProject}
                            onProjectClick={handleProjectClick}
                          />

                        </React.Fragment>
                      ))}

                      {/* Render projects */}
                      {activeProjects.map((project) => (
                        <SortableProjectCard
                          key={project.id}
                          project={project}
                          onEdit={handleEditProject}
                          onDelete={handleDeleteProject}
                          onClone={handleCloneProject}
                          onClick={handleProjectClick}
                          isArchived={false}
                          folders={folders}
                          onMoveToFolder={moveProjectToFolder}
                          // Quick actions
                          onQuickAddTask={handleQuickAddTask}
                          onQuickChangeStatus={handleQuickChangeStatus}
                          onQuickChangeColor={handleQuickChangeColor}
                          onQuickChangeDueDate={handleQuickChangeDueDate}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  
                  <DragOverlay>
                    {activeProject ? (
                      <ProjectCard
                        project={activeProject}
                        onEdit={handleEditProject}
                        onDelete={handleDeleteProject}
                        onClick={handleProjectClick}
                        dragOverlayStyle={{ 
                          transform: 'rotate(5deg)',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.15)' 
                        }}
                      />
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </>
          )}

          {/* Archived Projects View */}
          {activeView === 'archived' && (
            <>
              {archivedProjects.length === 0 ? (
                <div className="text-center py-12">
                  <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-muted-foreground mb-2">No archived projects</div>
                  <p className="text-sm text-muted-foreground">
                    When you archive projects, they'll appear here. You can restore them anytime.
                  </p>
                </div>
              ) : (
                <div className={
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 items-start"
                    : "space-y-4"
                }>
                  {archivedProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onEdit={handleEditProject}
                      onDelete={handleDeleteProject}
                      onRestore={handleRestoreProject}
                      onPermanentlyDelete={handlePermanentlyDeleteProject}
                      onClick={handleProjectClick}
                      isArchived={true}
                      folders={folders}
                      onMoveToFolder={moveProjectToFolder}
                    />
                  ))}
                </div>
              )}
            </>
          )}

            {/* Projects Calendar View */}
            {activeView === 'calendar' && (
              <ProjectsCalendar projects={projects} />
            )}
          </div>
      </div>

      {/* Project Form Modal */}
      <Suspense fallback={null}>
        {isProjectModalOpen && (
          <ProjectFormModal
            isOpen={isProjectModalOpen}
            onClose={handleCloseModal}
            onSave={handleSaveProject}
            project={editingProject}
            folders={folders}
            defaultFolderId={selectedFolderId}
          />
        )}
      </Suspense>

      {/* Project Task Form Modal */}
      <Suspense fallback={null}>
        {isTaskModalOpen && (
          <ProjectTaskFormModal
            isOpen={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
            taskToEdit={editingTask || undefined}
            onSave={handleSaveTask}
          />
        )}
      </Suspense>

      {/* Folder Form Modal */}
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

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    }>
      <ProjectsPageContent />
    </Suspense>
  );
} 