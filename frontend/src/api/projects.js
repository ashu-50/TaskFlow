import api from './client';

export const projectsAPI = {
  getAll: async (params = {}) =>
    (await api.get('/projects', { params })).data,

  getById: async (id) =>
    (await api.get(`/projects/${id}`)).data,

  create: async (data) =>
    (await api.post('/projects', data)).data,

  update: async (id, data) =>
    (await api.patch(`/projects/${id}`, data)).data,

  delete: async (id) =>
    (await api.delete(`/projects/${id}`)).data,

  addMember: async (id, data) =>
    (await api.post(`/projects/${id}/members`, data)).data,

  removeMember: async (id, userId) =>
    (await api.delete(`/projects/${id}/members/${userId}`)).data,

  getMembers: async (id) =>
    (await api.get(`/projects/${id}/members`)).data,
};

export const tasksAPI = {
  getAll: async (params = {}) =>
    (await api.get('/tasks', { params })).data,

  getById: async (id) =>
    (await api.get(`/tasks/${id}`)).data,

  create: async (data) =>
    (await api.post('/tasks', data)).data,

  update: async (id, data) =>
    (await api.patch(`/tasks/${id}`, data)).data,

  delete: async (id) =>
    (await api.delete(`/tasks/${id}`)).data,
};

export const dashboardAPI = {
  getDashboard: async () =>
    (await api.get('/dashboard')).data,

  getUsers: async () =>
    (await api.get('/dashboard/users')).data,
};