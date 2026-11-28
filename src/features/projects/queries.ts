import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProject, deleteProject, getProject, listProjects } from '../../api/projects'

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

export function useDeleteProject(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: async () => {
      // 지운 프로젝트를 다시 불러오지 않게 상세·업로드 캐시를 먼저 버린다
      queryClient.removeQueries({ queryKey: projectKeys.detail(projectId) })
      await queryClient.invalidateQueries({ queryKey: projectKeys.all, exact: true })
    },
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  })
}
