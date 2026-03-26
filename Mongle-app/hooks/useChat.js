import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatsApi } from '../lib/api'

// 채팅방 목록 조회
export const useChats = (projectId) => {
  return useQuery({
    queryKey: ['chats', projectId],
    queryFn: () => chatsApi.getChats(projectId),
    enabled: !!projectId
  })
}

// 채팅방 메시지 조회
export const useChatMessages = (chatId) => {
  return useQuery({
    queryKey: ['chatMessages', chatId],
    queryFn: () => chatsApi.getMessages(chatId),
    enabled: !!chatId
  })
}

// 채팅방 생성
export const useCreateChat = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (chatData) => chatsApi.createChat(chatData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chats', data.project_id] })
    }
  })
}

// 메시지 전송
export const useSendMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (messageData) => chatsApi.sendMessage(messageData),
    onSuccess: (data) => {
      // 메시지 목록 캐시에 낙관적 업데이트
      queryClient.setQueryData(['chatMessages', data.chat_id], (oldData) => {
        return [...(oldData || []), data]
      })
    }
  })
}

// 채팅방 삭제
export const useDeleteChat = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => chatsApi.deleteChat(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    }
  })
}