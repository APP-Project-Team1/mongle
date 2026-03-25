import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vendorsApi } from '../lib/api'

// 전체 업체 조회
export const useVendors = (params = {}) => {
  return useQuery({
    queryKey: ['vendors', params],
    queryFn: async () => {
      const response = await vendorsApi.getVendors(params)
      return response
    }
  })
}

// 업체 생성
export const useCreateVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vendorData) => {
      const response = await vendorsApi.createVendor(vendorData)
      return response
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    }
  })
}

// 업체 수정
export const useUpdateVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...vendorData }) => {
      const response = await vendorsApi.updateVendor(id, vendorData)
      return response
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    }
  })
}

// 업체 삭제
export const useDeleteVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      await vendorsApi.deleteVendor(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    }
  })
}