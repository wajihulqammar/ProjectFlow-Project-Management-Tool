import { create } from 'zustand';
import { authApi } from '@/lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  avatarColor: string;
  role: string;
  jobTitle?: string;
  department?: string;
  bio?: string;
  preferences: {
    theme: string;
    defaultView: string;
    notifications: Record<string, boolean>;
  };
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login({ email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      set({ token, user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.register({ name, email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      set({ token, user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) { set({ isLoading: false }); return; }
    set({ isLoading: true });
    try {
      const res = await authApi.me();
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (data) => {
    set(state => ({ user: state.user ? { ...state.user, ...data } : null }));
  },
}));
