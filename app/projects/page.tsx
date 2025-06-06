'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';
import { Project } from '@/types';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Navigation } from '@/components/ui/Navigation';

// Lazy load the modal to reduce initial bundle size
const ProjectFormModal = lazy(() => import('@/components/modals/ProjectFormModal').then(module => ({ default: module.ProjectFormModal })));
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List,
  SortAsc,
  SortDesc
} from 'lucide-react';

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, loading, createProject, updateProject, deleteProject, addTaskToProject } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Project['status'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'updated'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Project form modal state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

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
          description: 'Design app interface and user experience',
          status: 'in-progress',
          priority: 'high',
          dueDate: '2024-02-15',
          estimatedHours: 40
        });

        // Marketing project tasks
        addTaskToProject(marketingProject.id, {
          title: 'Social media campaign',
          description: 'Execute social media marketing strategy',
          status: 'completed',
          priority: 'medium',
          estimatedHours: 30
        });

        addTaskToProject(marketingProject.id, {
          title: 'Performance analysis',
          description: 'Analyze campaign performance and ROI',
          status: 'completed',
          priority: 'low',
          estimatedHours: 8
        });
      }, 100);
    }
  }, [loading, projects.length, createProject, addTaskToProject]);

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

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

  const handleSaveProject = (projectData: Partial<Project>, isNew: boolean) => {
    if (isNew) {
      createProject(projectData as Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'progress'>);
    } else if (editingProject) {
      updateProject(editingProject.id, projectData);
    }
  };

  const handleCloseModal = () => {
    setIsProjectModalOpen(false);
    setEditingProject(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading projects...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Compact Header with Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Project['status'] | 'all')}
              className="px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'progress' | 'updated')}
              className="px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="updated">Last Updated</option>
              <option value="name">Name</option>
              <option value="progress">Progress</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-input rounded-lg hover:bg-accent transition-colors"
            >
              {sortOrder === 'asc' ? (
                <SortAsc className="w-4 h-4" />
              ) : (
                <SortDesc className="w-4 h-4" />
              )}
            </button>

            {/* View Mode */}
            <div className="flex items-center border border-input rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-accent' : ''} rounded-l-lg transition-colors`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-accent' : ''} rounded-r-lg transition-colors`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* New Project Button */}
            <button
              onClick={handleCreateProject}
              className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Projects Grid/List */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
            </div>
            {projects.length === 0 && (
              <button
                onClick={handleCreateProject}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create your first project
              </button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-3"
          }>
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={handleProjectClick}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Project Form Modal */}
      {isProjectModalOpen && (
        <Suspense fallback={null}>
          <ProjectFormModal
            isOpen={isProjectModalOpen}
            onClose={handleCloseModal}
            project={editingProject}
            onSave={handleSaveProject}
            onDelete={handleDeleteProject}
          />
        </Suspense>
      )}
    </div>
  );
} 