/**
 * useApi.js
 * React Query 기반의 API 호출 훅 모음
 * lib/api.js의 api 함수들을 useQuery / useMutation으로 감싼 Layer
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import {
  projectsApi,
  timelinesApi,
  budgetsApi,
  chatsApi,
  vendorsApi,
  couplesApi,
} from '../lib/api'

// ─────────────────────────────────────────────
// 공통 유틸
// ─────────────────────────────────────────────

/** 현재 로그인 세션의 accessToken 반환 */
export const useSession = () => {
  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    },
    staleTime: 5 * 60 * 1000, // 5분
  })
}

/** 현재 로그인된 유저 반환 */
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ─────────────────────────────────────────────
// 인증 (Auth)
// ─────────────────────────────────────────────

/** 로그인 */
export const useSignIn = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] })
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    },
  })
}

/** 회원가입 */
export const useSignUp = () => {
  return useMutation({
    mutationFn: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      return data
    },
  })
}

/** 로그아웃 */
export const useSignOut = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.clear() // 모든 캐시 초기화
    },
  })
}

// ─────────────────────────────────────────────
// 프로젝트 (Projects)
// ─────────────────────────────────────────────

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects(),
  })
}

export const useProject = (project_id) => {
  return useQuery({
    queryKey: ['projects', project_id],
    queryFn: () => projectsApi.getProject(project_id),
    enabled: !!project_id,
  })
}

export const useCreateProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => projectsApi.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export const useUpdateProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => projectsApi.updateProject(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export const useDeleteProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => projectsApi.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

// ─────────────────────────────────────────────
// 타임라인 (Timelines)
// ─────────────────────────────────────────────

export const useTimelines = (project_id) => {
  return useQuery({
    queryKey: ['timelines', project_id],
    queryFn: () => timelinesApi.getTimelines(project_id),
    enabled: !!project_id,
  })
}

export const useCreateTimeline = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => timelinesApi.createTimeline(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timelines', variables.project_id] })
    },
  })
}

export const useUpdateTimeline = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => timelinesApi.updateTimeline(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['timelines', data?.project_id] })
    },
  })
}

export const useDeleteTimeline = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => timelinesApi.deleteTimeline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timelines'] })
    },
  })
}

// ─────────────────────────────────────────────
// 예산 (Budgets)
// ─────────────────────────────────────────────

export const useBudgets = (project_id) => {
  return useQuery({
    queryKey: ['budgets', project_id],
    queryFn: () => budgetsApi.getBudgets(project_id),
    enabled: !!project_id,
  })
}

export const useBudgetItems = (budget_id) => {
  return useQuery({
    queryKey: ['budgetItems', budget_id],
    queryFn: () => budgetsApi.getBudgetItems(budget_id),
    enabled: !!budget_id,
  })
}

export const useCreateBudgetItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => budgetsApi.createBudgetItem(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgetItems', variables.budget_id] })
    },
  })
}

export const useUpdateBudgetItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => budgetsApi.updateBudgetItem(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budgetItems', data?.budget_id] })
    },
  })
}

export const useDeleteBudgetItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => budgetsApi.deleteBudgetItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetItems'] })
    },
  })
}

// ─────────────────────────────────────────────
// 채팅 (Chats)
// ─────────────────────────────────────────────

export const useChats = (project_id) => {
  return useQuery({
    queryKey: ['chats', project_id],
    queryFn: () => chatsApi.getChats(project_id),
    enabled: !!project_id,
  })
}

export const useMessages = (chat_id) => {
  return useQuery({
    queryKey: ['messages', chat_id],
    queryFn: () => chatsApi.getMessages(chat_id),
    enabled: !!chat_id,
  })
}

export const useCreateChat = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => chatsApi.createChat(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chats', variables.project_id] })
    },
  })
}

export const useSendMessage = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => chatsApi.sendMessage(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chat_id] })
    },
  })
}

export const useDeleteChat = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => chatsApi.deleteChat(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}

// ─────────────────────────────────────────────
// 업체 (Vendors)
// ─────────────────────────────────────────────

export const useVendors = (params = {}) => {
  return useQuery({
    queryKey: ['vendors', params],
    queryFn: () => vendorsApi.getVendors(params),
  })
}

export const useVendor = (id) => {
  return useQuery({
    queryKey: ['vendors', id],
    queryFn: () => vendorsApi.getVendor(id),
    enabled: !!id,
  })
}

export const useCreateVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => vendorsApi.createVendor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}

export const useUpdateVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => vendorsApi.updateVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}

export const useDeleteVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => vendorsApi.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}
// ─────────────────────────────────────────────
// 커플 (Couples)
// ─────────────────────────────────────────────

export const useInvites = () => {
  return useQuery({
    queryKey: ['invites'],
    queryFn: () => couplesApi.listInvites(),
  })
}

export const useInvite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => couplesApi.invite(data),
    onSuccess: () => {
      // 필요 시 관련 쿼리 무효화
    },
  })
}

export const useAcceptInvite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => couplesApi.accept(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
