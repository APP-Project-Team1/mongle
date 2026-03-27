import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { budgetsApi } from '../lib/api'

// 예산 조회 (프로젝트별 첫 번째 예산)
export const useBudget = (project_id) => {
  return useQuery({
    queryKey: ['budget', project_id],
    queryFn: async () => {
      const budgets = await budgetsApi.getBudgets(project_id)
      return budgets.length > 0 ? budgets[0] : { total_budget: 0, spent: 0 }
    },
    enabled: !!project_id
  })
}

// 예산 항목 조회 (project_id → 첫 번째 budget → items)
export const useBudgetItems = (project_id) => {
  return useQuery({
    queryKey: ['budgetItems', project_id],
    queryFn: async () => {
      const budgets = await budgetsApi.getBudgets(project_id)
      if (budgets.length === 0) return []
      return budgetsApi.getBudgetItems(budgets[0].id)
    },
    enabled: !!project_id
  })
}

// 예산 생성
export const useCreateBudget = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (budgetData) => budgetsApi.createBudget(budgetData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budget', data.project_id] })
    }
  })
}

// 예산 항목 생성
export const useCreateBudgetItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemData) => budgetsApi.createBudgetItem(itemData),
    onSuccess: (_, variables) => {
      // variables.project_id가 있으면 명확히 무효화, 없으면 전체
      if (variables?.project_id) {
        queryClient.invalidateQueries({ queryKey: ['budgetItems', variables.project_id] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['budgetItems'] })
      }
    }
  })
}

// 예산 항목 수정
export const useUpdateBudgetItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...itemData }) => budgetsApi.updateBudgetItem(id, itemData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budgetItems'] })
    }
  })
}

// 예산 항목 삭제
export const useDeleteBudgetItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => budgetsApi.deleteBudgetItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetItems'] })
    }
  })
}
