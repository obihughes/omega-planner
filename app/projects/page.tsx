'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';
import { Project } from '@/types';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectsCalendar } from '@/components/projects/ProjectsCalendar';
import { Navigation } from '@/components/ui/Navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Search, 
  Archive,
  Calendar,
  ChevronDown,
  SortAsc,
  SortDesc,
  Grid3X3,
  List
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

// Lazy load the modal to reduce initial bundle size
const ProjectFormModal = lazy(() => import('@/components/modals/ProjectFormModal').then(module => ({ default: module.ProjectFormModal })));

// Sortable Project Card wrapper
function SortableProjectCard({ 
  project, 
  onEdit, 
  onDelete, 
  onRestore, 
  onPermanentlyDelete, 
  onClick, 
  isArchived 
}: {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onRestore?: (projectId: string) => void;
  onPermanentlyDelete?: (projectId: string) => void;
  onClick: (project: Project) => void;
  isArchived?: boolean;
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
      onClick={onClick}
      isArchived={isArchived}
      isDragging={isDragging}
      transform={transform}
      listeners={listeners}
      attributes={attributes}
      setNodeRef={setNodeRef}
    />
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const { 
    projects, 
    loading, 
    createProject, 
    updateProject, 
    deleteProject, 
    restoreProject,
    permanentlyDeleteProject,
    reorderProjects,
    addTaskToProject 
  } = useProjects();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Project['status'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'updated' | 'order'>('order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeView, setActiveView] = useState<'active' | 'archived' | 'calendar'>('active');
  
  // Project form modal state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

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

  // Create sample projects if none exist
  useEffect(() => {
    if (!loading && projects.length === 0) {
      // Create sample projects with tasks
      const websiteProject = createProject({
        name: 'Website Redesign',
        description: 'Complete overhaul of the company website with modern design and improved UX',
        status: 'active',
        color: '#3B82F6',
        startDate: '2024-01-15',
        endDate: '2024-03-15'
      });
      
      const mobileProject = createProject({
        name: 'Mobile App Development',
        description: 'Native mobile application for iOS and Android platforms',
        status: 'planning',
        color: '#10B981',
        startDate: '2024-02-01',
        endDate: '2024-06-01'
      });
      
      const marketingProject = createProject({
        name: 'Marketing Campaign',
        description: 'Q1 digital marketing campaign across social media and search platforms',
        status: 'completed',
        color: '#F59E0B',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
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
  }, [loading, projects.length]);


  const activeProjects = projects
    .filter(p => !p.isDeleted)
    .filter(p => {
      if (statusFilter === 'all') return true;
      return p.status === statusFilter;
    })
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

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

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
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
        color: projectData.color || '#CCCCCC'
      });
    } else {
      updateProject(editingProject!.id, projectData);
    }
  };

  const handleCloseModal = () => {
    setIsProjectModalOpen(false);
    setEditingProject(null);
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      reorderProjects(active.id as string, over.id as string);
    }
    setActiveId(null);
  }

  const activeProject = activeId ? projects.find(p => p.id === activeId) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeView} onValueChange={(value: string) => setActiveView(value as 'active' | 'archived' | 'calendar')}>
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-fit grid-cols-3 bg-card/50 backdrop-blur-sm border border-border/50">
              <TabsTrigger value="active" className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm">
                <span>Active</span>
                <span className="bg-muted text-muted-foreground data-[state=active]:bg-primary-foreground/20 data-[state=active]:text-primary-foreground px-1.5 py-0.5 rounded-full text-xs font-medium">
                  {activeProjects.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="archived" className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm">
                <Archive className="w-4 h-4" />
                <span>Archived</span>
                <span className="bg-muted text-muted-foreground data-[state=active]:bg-primary-foreground/20 data-[state=active]:text-primary-foreground px-1.5 py-0.5 rounded-full text-xs font-medium">
                  {archivedProjects.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm">
                <Calendar className="w-4 h-4" />
                <span>Calendar</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-56 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm"
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2 text-sm">
                    <span>View</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Status</h4>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as Project['status'] | 'all')}
                        className="w-full px-3 py-2 rounded-lg bg-input border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="all">All Statuses</option>
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                        <option value="on-hold">On Hold</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Sort by</h4>
                      <div className="flex items-center space-x-1">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as 'name' | 'progress' | 'updated' | 'order')}
                          className="w-full px-3 py-2 rounded-lg bg-input border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="order">Custom Order</option>
                          <option value="name">Name</option>
                          <option value="progress">Progress</option>
                          <option value="updated">Last Updated</option>
                        </select>
                        <button
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                          className="p-2 border rounded-lg hover:bg-accent transition-colors"
                        >
                          {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
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
                onClick={handleCreateProject}
                className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2 font-medium shadow-sm hover:shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            </div>
          </div>

          <TabsContent value="active">
            {activeProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' ? 'No projects match your filters' : 'No active projects yet'}
                </div>
                {!searchTerm && statusFilter === 'all' && (
                  <button
                    onClick={handleCreateProject}
                    className="btn-primary px-6 py-3 rounded-lg inline-flex items-center space-x-2 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Your First Project</span>
                  </button>
                )}
              </div>
            ) : (
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
                      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                      : "space-y-4"
                  }>
                    {activeProjects.map((project) => (
                      <SortableProjectCard
                        key={project.id}
                        project={project}
                        onEdit={handleEditProject}
                        onDelete={handleDeleteProject}
                        onClick={handleProjectClick}
                        isArchived={false}
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
          </TabsContent>

          <TabsContent value="archived">
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
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
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
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar">
            <ProjectsCalendar projects={projects} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Project Form Modal */}
      <Suspense fallback={null}>
        {isProjectModalOpen && (
          <ProjectFormModal
            isOpen={isProjectModalOpen}
            onClose={handleCloseModal}
            onSave={handleSaveProject}
            project={editingProject}
          />
        )}
      </Suspense>
    </div>
  );
} 