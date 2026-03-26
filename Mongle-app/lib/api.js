import { supabase } from './supabase'
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// 개발 서버의 호스트 IP를 자동으로 추출
function getBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  if (Platform.OS === 'android') {
    const host = Constants.expoConfig?.hostUri?.split(':').shift();
    return host ? `http://${host}:8001` : 'http://10.0.2.2:8001';
  }
  const host = Constants.expoConfig?.hostUri?.split(':').shift();
  return host ? `http://${host}:8001` : 'http://127.0.0.1:8001';
}

const baseURL = getBaseUrl();

const buildHeaders = async (extraHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token || session?.provider_token
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  } catch (e) {
    console.warn('API: 토큰 조회 실패', e)
  }

  return headers
}

const request = async (path, options = {}) => {
  const url = `${baseURL}${path}`
  const headers = await buildHeaders(options.headers)

  const response = await fetch(url, {
    ...options,
    headers,
  })

  let data
  const text = await response.text()
  try {
    data = text ? JSON.parse(text) : null
  } catch (error) {
    data = text
  }

  if (!response.ok) {
    const error = new Error(data?.message || `API Error ${response.status}`)
    error.status = response.status
    error.response = data
    throw error
  }

  return data
}

export const api = {
  get: async (path, params = {}) => {
    let query = ''
    if (params && Object.keys(params).length) {
      const search = new URLSearchParams(params).toString()
      query = `?${search}`
    }
    return request(`${path}${query}`, { method: 'GET' })
  },
  post: async (path, body = {}) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: async (path, body = {}) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: async (path) => request(path, { method: 'DELETE' }),
}

// 프로젝트 관련 API
export const projectsApi = {
  getProjects: () => api.get('/projects'),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.del(`/projects/${id}`),
}

// 타임라인 관련 API
export const timelinesApi = {
  getTimelines: (projectId) => api.get('/timelines', { project_id: projectId }),
  getTimeline: (id) => api.get(`/timelines/${id}`),
  createTimeline: (data) => api.post('/timelines', data),
  updateTimeline: (id, data) => api.put(`/timelines/${id}`, data),
  deleteTimeline: (id) => api.del(`/timelines/${id}`),
}

// 예산 관련 API
export const budgetsApi = {
  getBudgets: (projectId) => api.get('/budgets', { project_id: projectId }),
  getBudget: (id) => api.get(`/budgets/${id}`),
  createBudget: (data) => api.post('/budgets', data),
  updateBudget: (id, data) => api.put(`/budgets/${id}`, data),
  deleteBudget: (id) => api.del(`/budgets/${id}`),
  getBudgetItems: (budgetId) => api.get('/budget-items', { budget_id: budgetId }),
  createBudgetItem: (data) => api.post('/budget-items', data),
  updateBudgetItem: (id, data) => api.put(`/budget-items/${id}`, data),
  deleteBudgetItem: (id) => api.del(`/budget-items/${id}`),
}

// 커플 관련 API
export const couplesApi = {
  getCouples: () => api.get('/couples'),
  createCouple: (data) => api.post('/couples', data),
  updateCouple: (id, data) => api.put(`/couples/${id}`, data),
  deleteCouple: (id) => api.del(`/couples/${id}`),
}

// 채팅 관련 API
export const chatsApi = {
  getChats: (projectId) => api.get('/chats', { project_id: projectId }),
  getChat: (id) => api.get(`/chats/${id}`),
  createChat: (data) => api.post('/chats', data),
  deleteChat: (id) => api.del(`/chats/${id}`),
  getMessages: (chatId) => api.get('/messages', { chat_id: chatId }),
  sendMessage: (data) => api.post('/messages', data),
}

// 업체 관련 API
export const vendorsApi = {
  getVendors: (params = {}) => api.get('/vendors', params),
  getVendor: (id) => api.get(`/vendors/${id}`),
  createVendor: (data) => api.post('/vendors', data),
  updateVendor: (id, data) => api.put(`/vendors/${id}`, data),
  deleteVendor: (id) => api.del(`/vendors/${id}`),
}

// 인증 관련 API (Supabase와 연동)
export const authApi = {
  signUp: (data) => api.post('/auth/signup', data),
  signIn: (data) => api.post('/auth/signin', data),
  signOut: () => api.post('/auth/signout'),
  getCurrentUser: () => api.get('/auth/me'),
  resetPassword: (data) => api.post('/auth/reset-password', data),
}

export const BASE_URL = baseURL;
export const API_ENDPOINTS = {
  chat: `${BASE_URL}/api/chat`,
};
