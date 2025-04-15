import { create } from 'zustand';
import { User } from '@/types/auth';
import { authApi } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.login(email, password);
      localStorage.setItem('token', response.access_token);
      set({ user: response.user, token: response.access_token });
    } catch (error) {
      set({ error: 'Giriş başarısız oldu' });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  register: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.register(data);
      localStorage.setItem('token', response.access_token);
      set({ user: response.user, token: response.access_token });
    } catch (error) {
      set({ error: 'Kayıt başarısız oldu' });
    } finally {
      set({ isLoading: false });
    }
  }
}));