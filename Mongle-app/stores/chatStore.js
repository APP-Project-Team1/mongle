import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useChatStore = create((set, get) => ({
  messages: [],
  currentChatId: null,
  loading: false,
  error: null,

  // 채팅방 메시지 조회
  fetchMessages: async (chatId) => {
    set({ loading: true, error: null })
    try {
      // TODO: API 구현 후 실제 호출로 변경
      // const { data, error } = await supabase
      //   .from('messages')
      //   .select('*')
      //   .eq('chat_id', chatId)
      //   .order('created_at', { ascending: true })

      // 임시 데이터
      const mockMessages = [
        {
          id: '1',
          chat_id: chatId,
          sender: 'user',
          content: '웨딩홀 예약하고 싶어요',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          chat_id: chatId,
          sender: 'ai',
          content: '네, 어떤 스타일의 웨딩홀을 찾으시나요? 예산은 어떻게 되시나요?',
          created_at: new Date().toISOString()
        }
      ]

      set({ messages: mockMessages, currentChatId: chatId, loading: false })
      return { data: mockMessages, error: null }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { data: null, error }
    }
  },

  // 메시지 전송
  sendMessage: async (chatId, content, sender = 'user') => {
    set({ loading: true, error: null })
    try {
      // TODO: API 구현 후 실제 호출로 변경
      // const { data, error } = await supabase
      //   .from('messages')
      //   .insert([{
      //     chat_id: chatId,
      //     sender,
      //     content
      //   }])
      //   .select()
      //   .single()

      const newMessage = {
        id: Date.now().toString(),
        chat_id: chatId,
        sender,
        content,
        created_at: new Date().toISOString()
      }

      const { messages } = get()
      set({ messages: [...messages, newMessage], loading: false })

      // AI 응답 시뮬레이션 (실제로는 API에서 처리)
      if (sender === 'user') {
        setTimeout(() => {
          const aiResponse = {
            id: (Date.now() + 1).toString(),
            chat_id: chatId,
            sender: 'ai',
            content: '알려주신 정보를 바탕으로 최적의 업체를 추천해드리겠습니다.',
            created_at: new Date().toISOString()
          }
          const currentMessages = get().messages
          set({ messages: [...currentMessages, aiResponse] })
        }, 1000)
      }

      return { data: newMessage, error: null }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { data: null, error }
    }
  },

  // 채팅방 생성
  createChat: async (projectId, title = '새 채팅') => {
    set({ loading: true, error: null })
    try {
      // TODO: API 구현 후 실제 호출로 변경
      // const { data, error } = await supabase
      //   .from('chats')
      //   .insert([{
      //     project_id: projectId,
      //     title
      //   }])
      //   .select()
      //   .single()

      const newChat = {
        id: Date.now().toString(),
        project_id: projectId,
        title,
        created_at: new Date().toISOString()
      }

      set({ currentChatId: newChat.id, messages: [], loading: false })
      return { data: newChat, error: null }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { data: null, error }
    }
  },

  // 현재 채팅 ID 설정
  setCurrentChatId: (chatId) => set({ currentChatId: chatId }),

  // 메시지 초기화
  clearMessages: () => set({ messages: [] }),

  // 에러 초기화
  clearError: () => set({ error: null })
}))