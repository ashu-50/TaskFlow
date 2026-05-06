import api from './client';

export const authAPI = {
  signup: async (data) =>
    (await api.post('/auth/signup', data)).data,

  login: async (data) => {
    const res = await api.post('/auth/login', data);
    const { token, user } = res.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return res.data;
  },

  me: async () =>
    (await api.get('/auth/me')).data,

  changePassword: async (data) =>
    (await api.patch('/auth/change-password', data)).data,

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};