import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { timelinesApi } from '../lib/api'

// 타임라인 목록 조회
export const useTimelines = (projectId) => {
  return useQuery({
    queryKey: ['timelines', projectId],
    queryFn: () => timelinesApi.getTimelines(projectId),
    enabled: !!projectId
  })
}

// 타임라인 생성
export const useCreateTimeline = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (timelineData) => timelinesApi.createTimeline(timelineData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['timelines', data.project_id] })
    }
  })
}

// 타임라인 수정
export const useUpdateTimeline = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...updates }) => timelinesApi.updateTimeline(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['timelines', data.project_id] })
    }
  })
}

// 타임라인 삭제
export const useDeleteTimeline = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => timelinesApi.deleteTimeline(id),
    onSuccess: () => {
      // project_id를 알 수 없으므로 전체 무효화
      queryClient.invalidateQueries({ queryKey: ['timelines'] })
    }
  })
}
