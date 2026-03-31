import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API ERROR:", error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const projectsApi = {
  getProjects: async () => {
    const res = await api.get("/projects/");
    return res.data.data;
  },
  getProject: async (projectId) => {
    const res = await api.get(`/projects/${projectId}`);
    return res.data.data;
  },
};

export const dashboardApi = {
  getDashboard: async (projectId) => {
    const res = await api.get(`/dashboard/${projectId}`);
    return res.data.data;
  },
};

export const timelinesApi = {
  getTimelines: async (projectId) => {
    const res = await api.get(`/timelines/project/${projectId}`);
    return res.data.data;
  },
};

export const budgetsApi = {
  getBudgets: async (projectId) => {
    const res = await api.get(`/budgets/project/${projectId}`);
    return res.data.data;
  },
};

export const vendorsApi = {
  getVendors: async (projectId) => {
    const res = await api.get(`/vendors/project/${projectId}`);
    return res.data.data;
  },
};

export const chatsApi = {
  getChats: async (projectId) => {
    const res = await api.get(`/chats/project/${projectId}`);
    return res.data.data;
  },
};

export default api;
