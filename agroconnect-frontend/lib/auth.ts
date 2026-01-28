import { create } from 'zustand';
import { apiClient, getErrorMessage } from './api';

interface User {
  id: string;
  email: string;
  role: 'FARMER' | 'BUYER';
}

interface AuthStore {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  register: (data: any) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.register(data);
      const { user, token } = response.data;
      apiClient.setToken(token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, loading: false });
    } catch (error: any) {
      const message = getErrorMessage(error);
      set({ error: message, loading: false });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.login(email, password);
      const { user, token } = response.data;
      apiClient.setToken(token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, loading: false });
    } catch (error: any) {
      const message = getErrorMessage(error);
      set({ error: message, loading: false });
      throw error;
    }
  },

  logout: () => {
    apiClient.clearToken();
    localStorage.removeItem('user');
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),
}));

// Initialize from localStorage
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  if (token && user) {
    useAuthStore.setState({
      token,
      user: JSON.parse(user),
    });
    apiClient.setToken(token);
  }
}
