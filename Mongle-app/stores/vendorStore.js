import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useVendorStore = create((set, get) => ({
  vendors: [],
  filteredVendors: [],
  currentVendor: null,
  loading: false,
  error: null,
  filters: {
    category: null,
    region: null,
    priceMin: null,
    priceMax: null
  },

  // 전체 업체 조회
  fetchVendors: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name')

      if (error) throw error

      set({ vendors: data, filteredVendors: data, loading: false })
      return { data, error: null }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { data: null, error }
    }
  },

  // 업체 검색 및 필터링
  searchVendors: async (query, filters = {}) => {
    set({ loading: true, error: null })
    try {
      let queryBuilder = supabase
        .from('vendors')
        .select('*')

      // 검색어 적용
      if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,category.ilike.%${query}%,region.ilike.%${query}%`)
      }

      // 필터 적용
      if (filters.category) {
        queryBuilder = queryBuilder.eq('category', filters.category)
      }
      if (filters.region) {
        queryBuilder = queryBuilder.ilike('region', `%${filters.region}%`)
      }
      if (filters.priceMin !== null) {
        queryBuilder = queryBuilder.gte('price_min', filters.priceMin)
      }
      if (filters.priceMax !== null) {
        queryBuilder = queryBuilder.lte('price_max', filters.priceMax)
      }

      const { data, error } = await queryBuilder.order('name')

      if (error) throw error

      set({ filteredVendors: data, filters, loading: false })
      return { data, error: null }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { data: null, error }
    }
  },

  // 카테고리별 업체 조회
  fetchVendorsByCategory: async (category) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('category', category)
        .order('name')

      if (error) throw error

      set({ filteredVendors: data, loading: false })
      return { data, error: null }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { data: null, error }
    }
  },

  // 단일 업체 조회
  fetchVendor: async (id) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      set({ currentVendor: data, loading: false })
      return { data, error: null }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { data: null, error }
    }
  },

  // 추천 업체 조회 (평점, 리뷰 수 기준)
  fetchRecommendedVendors: async (category, limit = 10) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('category', category)
        .not('rating', 'is', null)
        .order('rating', { ascending: false })
        .order('review_count', { ascending: false })
        .limit(limit)

      if (error) throw error

      set({ filteredVendors: data, loading: false })
      return { data, error: null }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { data: null, error }
    }
  },

  // 현재 업체 설정
  setCurrentVendor: (vendor) => set({ currentVendor: vendor }),

  // 필터 설정
  setFilters: (filters) => set({ filters }),

  // 필터 초기화
  clearFilters: () => set({
    filters: { category: null, region: null, priceMin: null, priceMax: null },
    filteredVendors: get().vendors
  }),

  // 에러 초기화
  clearError: () => set({ error: null })
}))