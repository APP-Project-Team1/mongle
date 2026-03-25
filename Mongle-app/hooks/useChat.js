import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatsApi } from '../lib/api'

// 채팅방 조회
export const useChats = (projectId) => {
  return useQuery({
    queryKey: ['chats', projectId],
    queryFn: async () => {
      const response = await chatsApi.getChats(projectId)
      return response
    },
    enabled: !!projectId
  })
}

// 채팅 메시지 조회
export const useChatMessages = (chatId) => {
  return useQuery({
    queryKey: ['chatMessages', chatId],
    queryFn: async () => {
      const response = await chatsApi.getMessages(chatId)
      return response
    },
    enabled: !!chatId
  })
}

// 채팅방 생성
export const useCreateChat = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (chatData) => {
      const response = await chatsApi.createChat(chatData)
      return response
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chats', data.project_id] })
    }
  })
}

// 메시지 전송
export const useSendMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (messageData) => {
      const response = await chatsApi.sendMessage(messageData)
      return response
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', data.chat_id] })
    }
  })
}
      //   .select()
      //   .single()

      return {
        id: Date.now().toString(),
        chat_id: chatId,
        sender,
        content,
        created_at: new Date().toISOString()
      }
    },
    onSuccess: (data) => {
      // 메시지 목록 캐시 업데이트
      queryClient.setQueryData(['chatMessages', data.chat_id], (oldData) => {
        return [...(oldData || []), data]
      })

      // AI 응답 시뮬레이션
      if (data.sender === 'user') {
        setTimeout(() => {
          const aiResponse = {
            id: (Date.now() + 1).toString(),
            chat_id: data.chat_id,
            sender: 'ai',
            content: '알려주신 정보를 바탕으로 최적의 업체를 추천해드리겠습니다.',
            created_at: new Date().toISOString()
          }
          queryClient.setQueryData(['chatMessages', data.chat_id], (oldData) => {
            return [...(oldData || []), aiResponse]
          })
        }, 1000)
      }
    }
  })
}

// 채팅방 생성 (임시)
export const useCreateChat = () => {
  return useMutation({
    mutationFn: async ({ projectId, title = '새 채팅' }) => {
      // TODO: 실제 API 호출로 변경
      // const { data, error } = await supabase
      //   .from('chats')
      //   .insert([{
      //     project_id: projectId,
      //     title
      //   }])
      //   .select()
      //   .single()

      return {
        id: Date.now().toString(),
        project_id: projectId,
        title,
        created_at: new Date().toISOString()
      }
    }
  })
}