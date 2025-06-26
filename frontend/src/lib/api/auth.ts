import api from '../api'; // api'yi import ettik
import { LoginResponse, RegisterData } from '@/types/auth'; // LoginResponse ve RegisterData'yı import ettik

export const authApi = { // authApi objesi oluşturduk
  login: async (email: string, password: string): Promise<LoginResponse> => { // login fonksiyonu oluşturduk
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  register: async (data: RegisterData): Promise<LoginResponse> => { // register fonksiyonu oluşturduk
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getCurrentUser: async () => { // getCurrentUser fonksiyonu oluşturduk
    const response = await api.get('/api/auth/me');
    return response.data;
  }
};