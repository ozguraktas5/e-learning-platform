'use client';

import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

declare global {
  interface Window {
    location: Location;
  }
}

// Export this so it can be used for file URLs
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Doğrudan dosyalardan içe aktar ve yeniden ihraç et
export * from './auth';
export * from './profile';
export * from './enrollments';
export * from './courses';
export * from './lessons';
export * from './reviews';

// Api error response'ları çakışmaması için, quiz ve assignments'dan yeniden export edilmiyor
// Özel export'lar gerekiyorsa burada tek tek belirtilmeli 