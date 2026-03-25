import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { timelinesApi } from '../lib/api'

// 타임라인 조회
export const useTimelines = (projectId) => {
  return useQuery({
    queryKey: ['timelines', projectId],
    queryFn: async () => {
      const response = await timelinesApi.getTimelines(projectId)
      return response
    },
    enabled: !!projectId
  })
}

// 타임라인 생성
export const useCreateTimeline = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (timelineData) => {
      const response = await timelinesApi.createTimeline(timelineData)
      return response
    },
    onSuccess: (data) => {
      // 타임라인 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['timelines', data.project_id] })
    }
  })
}

// 타임라인 업데이트
export const useUpdateTimeline = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const response = await timelinesApi.updateTimeline(id, updates)
      return response
    },
    onSuccess: (data) => {
      // 타임라인 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['timelines', data.project_id] })
    }
  })
}

// 타임라인 삭제
export const useDeleteTimeline = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      await timelinesApi.deleteTimeline(id)
      return id
    },
    onSuccess: (data, id) => {
      // 모든 타임라인 쿼리 무효화 (project_id를 모르기 때문에)
      queryClient.invalidateQueries({ queryKey: ['timelines'] })
    }
  })
}
