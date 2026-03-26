import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useBudgetStore = create((set, get) => ({
  budget: null,
  budgetItems: [],
  loading: false,
  error: null,

  // 예산 조회 (프로젝트별)
  fetchBudget: async (projectId) => {
    set({ loading: true, error: null })
    try {
      // TODO: API 구현 후 실제 호출로 변경
      // const { data, error } = await supabase
      //   .from('budgets')
      //   .select('*')
      //   .eq('project_id', projectId)
      //   .single()

      // 임시 데이터
      const mockBudget = {
        id: '1',
        project_id: projectId,
        total_budget: 10000000,
        spent: 3500000,
        remaining: 6500000
      }

      set({ budget: mockBudget, loading: false })
      return { data: mockBudget, error: null }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || '예산 데이터 로드 실패';
      set({ error: errorMessage, loading: false })
      return { data: null, error: errorMessage }
    }
  },

  // 예산 항목 조회
  fetchBudgetItems: async (projectId) => {
    set({ loading: true, error: null })
    try {
      // TODO: API 구현 후 실제 호출로 변경
      // const { data, error } = await supabase
      //   .from('budget_items')
      //   .select('*')
      //   .eq('project_id', projectId)

      // 임시 데이터
      const mockItems = [
        { id: '1', category: '웨딩홀', amount: 5000000, spent: 3000000 },
        { id: '2', category: '스튜디오', amount: 2000000, spent: 500000 },
        { id: '3', category: '드레스', amount: 1500000, spent: 0 },
        { id: '4', category: '메이크업', amount: 800000, spent: 0 },
        { id: '5', category: '기타', amount: 700000, spent: 0 }
      ]

      set({ budgetItems: mockItems, loading: false })
      return { data: mockItems, error: null }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || '예산 항목 로드 실패';
      set({ error: errorMessage, loading: false })
      return { data: null, error: errorMessage }
    }
  },

  // 예산 항목 추가
  addBudgetItem: async (itemData) => {
    set({ loading: true, error: null })
    try {
      // TODO: API 구현 후 실제 호출로 변경
      // const { data, error } = await supabase
      //   .from('budget_items')
      //   .insert([itemData])
      //   .select()
      //   .single()

      const newItem = { ...itemData, id: Date.now().toString() }

      const { budgetItems } = get()
      set({ budgetItems: [...budgetItems, newItem], loading: false })

      return { data: newItem, error: null }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || '예산 항목 추가 실패';
      set({ error: errorMessage, loading: false })
      return { data: null, error: errorMessage }
    }
  },

  // 예산 항목 업데이트
  updateBudgetItem: async (id, updates) => {
    set({ loading: true, error: null })
    try {
      // TODO: API 구현 후 실제 호출로 변경
      // const { data, error } = await supabase
      //   .from('budget_items')
      //   .update(updates)
      //   .eq('id', id)
      //   .select()
      //   .single()

      const { budgetItems } = get()
      const updatedItems = budgetItems.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
      set({ budgetItems: updatedItems, loading: false })

      return { data: updatedItems.find(item => item.id === id), error: null }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || '예산 항목 수정 실패';
      set({ error: errorMessage, loading: false })
      return { data: null, error: errorMessage }
    }
  },

  // 예산 항목 삭제
  deleteBudgetItem: async (id) => {
    set({ loading: true, error: null })
    try {
      // TODO: API 구현 후 실제 호출로 변경
      // const { error } = await supabase
      //   .from('budget_items')
      //   .delete()
      //   .eq('id', id)

      const { budgetItems } = get()
      const filteredItems = budgetItems.filter(item => item.id !== id)
      set({ budgetItems: filteredItems, loading: false })

      return { error: null }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || '예산 항목 삭제 실패';
      set({ error: errorMessage, loading: false })
      return { error: errorMessage }
    }
  },

  // 에러 초기화
  clearError: () => set({ error: null })
}))