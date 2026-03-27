import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatsApi } from '../lib/api'

// 채팅방 목록 조회
export const useChats = (project_id) => {
  return useQuery({
    queryKey: ['chats', project_id],
    queryFn: () => chatsApi.getChats(project_id),
    enabled: !!project_id
  })
}

// 채팅방 메시지 조회
export const useChatMessages = (chat_id) => {
  return useQuery({
    queryKey: ['chatMessages', chat_id],
    queryFn: () => chatsApi.getMessages(chat_id),
    enabled: !!chat_id
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