import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProject, getProject, listProjects } from '../../api/projects'

export const projectKeys = {
  all: ['projects'] as const,
  detail: (projectId: number) => ['projects', projectId] as const,
}

export function useProjects() {
  return useQuery({ queryKey: projectKeys.all, queryFn: listProjects })
}

export function useProject(projectId: number) {
  return useQuery({ queryKey: projectKeys.detail(projectId), queryFn: () => getProject(projectId) })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  })
}
