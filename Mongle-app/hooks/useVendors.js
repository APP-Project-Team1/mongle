import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vendorsApi } from '../lib/api'

// 업체 목록 조회
export const useVendors = (params = {}) => {
  return useQuery({
    queryKey: ['vendors', params],
    queryFn: () => vendorsApi.getVendors(params)
  })
}

// 단일 업체 조회
export const useVendor = (id) => {
  return useQuery({
    queryKey: ['vendors', id],
    queryFn: () => vendorsApi.getVendor(id),
    enabled: !!id
  })
}

// 업체 생성
export const useCreateVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vendorData) => vendorsApi.createVendor(vendorData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    }
  })
}

// 업체 수정
export const useUpdateVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...vendorData }) => vendorsApi.updateVendor(id, vendorData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    }
  })
}

// 업체 삭제
export const useDeleteVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => vendorsApi.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    }
  })
}