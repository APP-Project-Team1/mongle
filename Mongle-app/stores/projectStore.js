import { create } from 'zustand'
import { projectsApi } from '../lib/api'
import { supabase } from '../lib/supabase'

export const useProjectStore = create((set, get) => ({
  projects: [],
  active: null,
  active_id: null,
  active_name: null,
  loading: false,
  error: null,

  // 프로젝트 목록 조회
  loadProjects: async () => {
    set({ loading: true, error: null })
    try {
      const response = await projectsApi.getProjects()
      set({ projects: response, loading: false })
      return { data: response, error: null }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || '프로젝트 조회 실패'
      set({ error: msg, loading: false })
      return { data: null, error: msg }
    }
  },

  // 특정 프로젝트 조회
  fetchProject: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await projectsApi.getProject(id)
      set({ active: response, loading: false })
      return { data: response, error: null }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || '프로젝트 상세 조회 실패'
      set({ error: msg, loading: false })
      return { data: null, error: msg }
    }
  },

  // 프로젝트 생성
  createProject: async (projectData) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // 사용자의 couple 찾기 (없어도 진행)
      let couples = null;
      if (user) {
        const { data } = await supabase
          .from('couples')
          .select('id')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .maybeSingle()
        couples = data;
      }

      const projectWithIds = {
        ...projectData,
        couple_id: couples?.id || null,
        owner_id: user?.id || null,
        status: 'active'
      }

      const response = await projectsApi.createProject(projectWithIds)

      // 프로젝트 목록 업데이트
      const { projects } = get()
      set({
        projects: [response, ...projects],
        active: response,
        active_id: response.id,
        active_name: response.name,
        loading: false
      })

      return { data: response, error: null }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || '프로젝트 생성 실패'
      set({ error: msg, loading: false })
      return { data: null, error: msg }
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
        active: response,
        loading: false
      })

      return { data: response, error: null }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || '프로젝트 수정 실패'
      set({ error: msg, loading: false })
      return { data: null, error: msg }
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
        active: null,
        loading: false
      })

      return { error: null }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || '프로젝트 삭제 실패'
      set({ error: msg, loading: false })
      return { error: msg }
    }
  },

  // 현재 프로젝트 설정
  setActive: (project) => set({
    active: project,
    active_id: project?.id ?? null,
    active_name: project?.name ?? null,
  }),

  // 현재 프로젝트 id로 설정
  setActiveById: (project_id) => {
    const project = get().projects.find((p) => p.id === project_id)
    if (project) {
      set({
        active: project,
        active_id: project.id,
        active_name: project.name,
      })
    }
  },

  // 초기화
  resetActive: () => set({
    active: null,
    active_id: null,
    active_name: null,
  }),

  // 에러 초기화
  clearError: () => set({ error: null })
}))