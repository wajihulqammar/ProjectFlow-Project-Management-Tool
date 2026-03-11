import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.error || error.message || 'Something went wrong';
    if (error.response?.status === 401) {
      localStorage.removeItem('pf_token');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    } else {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default api;

export const projectsAPI = {
  getAll: (params?: any) => api.get('/projects', { params }),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  addMember: (id: string, data: any) => api.post(`/projects/${id}/members`, data),
  removeMember: (id: string, userId: string) => api.delete(`/projects/${id}/members/${userId}`),
  toggleFavorite: (id: string) => api.post(`/projects/${id}/favorite`),
};

export const tasksAPI = {
  getAll: (params: any) => api.get('/tasks', { params }),
  getById: (id: string) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  reorder: (data: any) => api.patch('/tasks/reorder', data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  getComments: (id: string) => api.get(`/tasks/${id}/comments`),
  addComment: (id: string, data: any) => api.post(`/tasks/${id}/comments`, data),
  toggleWatch: (id: string) => api.post(`/tasks/${id}/watch`),
};

export const dashboardAPI = { getStats: () => api.get('/dashboard') };
export const usersAPI = {
  search: (q: string) => api.get('/users/search', { params: { q } }),
  getById: (id: string) => api.get(`/users/${id}`),
};
export const activitiesAPI = {
  getAll: (params: any) => api.get('/activities', { params }),
};
