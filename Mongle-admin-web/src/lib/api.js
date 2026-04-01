import apiClient from './apiClient';

export const api = {
  // 프로젝트
  getProjects: () => apiClient.get('/projects'),
  getProject: (id) => apiClient.get(`/projects/${id}`),
  createProject: (data) => apiClient.post('/projects', data),

  // 타임라인
  getTimelines: (projectId) =>
    apiClient.get(`/timelines/project/${projectId}`),
  createTimeline: (data) => apiClient.post('/timelines', data),

  // 예산
  getBudgets: (projectId) =>
    apiClient.get(`/budgets/project/${projectId}`),
  createBudget: (data) => apiClient.post('/budgets', data),

  // 업체
  getVendors: () => apiClient.get('/vendors'),

  // 채팅
  getChats: (projectId) =>
    apiClient.get(`/chats/project/${projectId}`),
};