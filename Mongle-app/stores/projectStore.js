import { create } from 'zustand'
import { projectsApi } from '../lib/api'
import { supabase } from '../lib/supabase'

export const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  currentProjectId: null,
  currentProjectName: null,
  loading: false,
  error: null,

  // 프로젝트 목록 조회
  fetchProjects: async () => {
    set({ loading: true, error: null })
    try {
      const response = await projectsApi.getProjects()
      set({ projects: response, loading: false })
      return { data: response, error: null }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { data: null, error }
    }
  },

  // 특정 프로젝트 조회
  fetchProject: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await projectsApi.getProject(id)
      set({ currentProject: response, loading: false })
      return { data: response, error: null }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { data: null, error }
    }
  },

  // 프로젝트 생성
  createProject: async (projectData) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // 사용자의 couple 찾기 (없어도 진행)
      const { data: couples } = await supabase
        .from('couples')
        .select('id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .maybeSingle()

      const projectWithIds = {
        ...projectData,
        couple_id: couples?.id || null,
        owner_id: user.id,
        status: 'active'
      }

      const response = await projectsApi.createProject(projectWithIds)

      // 프로젝트 목록 업데이트
      const { projects } = get()
      set({
        projects: [response, ...projects],
        currentProject: response,
        currentProjectId: response.id,
        currentProjectName: response.name,
        loading: false
      })

      return { data: response, error: null }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { data: null, error }
    }
  },

  // 프로젝트 업데이트
  updateProject: async (id, updates) => {
    set({ loading: true, error: null })
    try {
      const response = await projectsApi.updateProject(id, updates)

      // 프로젝트 목록 업데이트
      const { projects } = get()
      const updatedProjects = projects.map(project =>
        project.id === id ? response : project
      )
      set({
        projects: updatedProjects,
        currentProject: response,
        loading: false
      })

      return { data: response, error: null }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { data: null, error }
    }
  },

  // 프로젝트 삭제
  deleteProject: async (id) => {
    set({ loading: true, error: null })
    try {
      await projectsApi.deleteProject(id)

      // 프로젝트 목록에서 제거
      const { projects } = get()
      const filteredProjects = projects.filter(project => project.id !== id)
      set({
        projects: filteredProjects,
        currentProject: null,
        loading: false
      })

      return { error: null }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { error }
    }
  },

  // 현재 프로젝트 설정
  setCurrentProject: (project) => set({
    currentProject: project,
    currentProjectId: project?.id ?? null,
    currentProjectName: project?.name ?? null,
  }),

  // 현재 프로젝트 id로 설정
  setCurrentProjectById: (projectId) => {
    const project = get().projects.find((p) => p.id === projectId)
    if (project) {
      set({
        currentProject: project,
        currentProjectId: project.id,
        currentProjectName: project.name,
      })
    }
  },

  // 초기화
  resetCurrentProject: () => set({
    currentProject: null,
    currentProjectId: null,
    currentProjectName: null,
  }),

  // 에러 초기화
  clearError: () => set({ error: null })
}))