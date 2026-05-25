import { useProjectsContext } from '@/app/context/ProjectsContext';

export function useProjects() {
  return useProjectsContext();
}
