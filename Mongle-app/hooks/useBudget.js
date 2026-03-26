import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { budgetsApi } from '../lib/api'

// 예산 조회
export const useBudget = (projectId) => {
  return useQuery({
    queryKey: ['budget', projectId],
    queryFn: async () => {
      const budgets = await budgetsApi.getBudgets(projectId)
      // 프로젝트의 첫 번째 예산 반환 (또는 합계 계산)
      return budgets.length > 0 ? budgets[0] : { total_budget: 0, spent: 0 }
    },
    enabled: !!projectId
  })
}

// 예산 항목 조회
export const useBudgetItems = (projectId) => {
  return useQuery({
    queryKey: ['budgetItems', projectId],
    queryFn: async () => {
      const budgets = await budgetsApi.getBudgets(projectId)
      if (budgets.length === 0) return []

      // 첫 번째 예산의 항목들 조회
      const budgetItems = await budgetsApi.getBudgetItems(budgets[0].id)
      return budgetItems
    },
    enabled: !!projectId
  })
}

// 예산 생성
export const useCreateBudget = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (budgetData) => {
      const response = await budgetsApi.createBudget(budgetData)
      return response
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budget', data.project_id] })
    }
  })
}

// 예산 항목 생성
export const useCreateBudgetItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemData) => {
      const response = await budgetsApi.createBudgetItem(itemData)
      return response
    },
    onSuccess: (data, variables) => {
      // url이나 arguments에서 projectId를 가져오거나 itemData의 project_id 사용
      // 여기서는 data.project_id 혹은 변수의 project_id를 활용 (API 응답에 project_id가 포함되어야 함)
      queryClient.invalidateQueries({ queryKey: ['budgetItems'] })
    }
  })
}

// 예산 항목 수정
export const useUpdateBudgetItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...itemData }) => {
      const response = await budgetsApi.updateBudgetItem(id, itemData)
      return response
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budgetItems'] })
    }
  })
}

// 예산 항목 삭제
export const useDeleteBudgetItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      await budgetsApi.deleteBudgetItem(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetItems'] })
    }
  })
}

