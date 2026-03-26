import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useTimelineStore = create((set, get) => ({
  timelines: [],
  currentTimeline: null,
  loading: false,
  error: null,

  // 프로젝트별 타임라인 조회
  fetchTimelinesByProject: async (projectId) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('timelines')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (error) throw error

      set({ timelines: data, loading: false })
      return { data, error: null }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || '타임라인 조회 실패';
      set({ error: errorMessage, loading: false })
      return { data: null, error: errorMessage }
    }
  },

  // 타임라인 생성
  createTimeline: async (timelineData) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('timelines')
        .insert([timelineData])
        .select()
        .single()

      if (error) throw error

      // 타임라인 목록 업데이트
      const { timelines } = get()
      set({ timelines: [...timelines, data], loading: false })

      return { data, error: null }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || '타임라인 생성 실패';
      set({ error: errorMessage, loading: false })
      return { data: null, error: errorMessage }
    }
  },

  // 타임라인 업데이트
  updateTimeline: async (id, updates) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('timelines')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // 타임라인 목록 업데이트
      const { timelines } = get()
      const updatedTimelines = timelines.map(timeline =>
        timeline.id === id ? data : timeline
      )
      set({
        timelines: updatedTimelines,
        currentTimeline: data,
        loading: false
      })

      return { data, error: null }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { data: null, error }
    }
  },

  // 타임라인 삭제
  deleteTimeline: async (id) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('timelines')
        .delete()
        .eq('id', id)

      if (error) throw error

      // 타임라인 목록에서 제거
      const { timelines } = get()
      const filteredTimelines = timelines.filter(timeline => timeline.id !== id)
      set({
        timelines: filteredTimelines,
        currentTimeline: null,
        loading: false
      })

      return { error: null }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || '타임라인 삭제 실패';
      set({ error: errorMessage, loading: false })
      return { error: errorMessage }
    }
  },

  // 현재 타임라인 설정
  setCurrentTimeline: (timeline) => set({ currentTimeline: timeline }),

  // 에러 초기화
  clearError: () => set({ error: null })
}))