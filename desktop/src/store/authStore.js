import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('marwa_user') || 'null'),
  token: localStorage.getItem('marwa_token') || null,
  isAuthenticated: !!localStorage.getItem('marwa_token'),
  isLoading: false,
  error: null,

  login: async (code) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { code });
      const { user, token } = response.data;
      localStorage.setItem('marwa_token', token);
      localStorage.setItem('marwa_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
      return { success: true, user };
    } catch (err) {
      set({ isLoading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  logout: () => {
    localStorage.removeItem('marwa_token');
    localStorage.removeItem('marwa_user');
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('marwa_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false });
      return;
    }
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data.user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('marwa_token');
      localStorage.removeItem('marwa_user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  }
}));
