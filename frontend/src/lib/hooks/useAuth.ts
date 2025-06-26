import { create } from 'zustand'; // create'i import ettik
import { User } from '@/types/auth'; // User'ı import ettik
import { authApi } from '../api/auth'; // authApi'ı import ettik

interface AuthState { // AuthState interface'i oluşturduk
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>; // register fonksiyonu oluşturduk
}

export const useAuth = create<AuthState>((set) => ({ // useAuth fonksiyonu oluşturduk
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email, password) => { // login fonksiyonu oluşturduk
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

  logout: () => { // logout fonksiyonu oluşturduk
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  register: async (data) => { // register fonksiyonu oluşturduk
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