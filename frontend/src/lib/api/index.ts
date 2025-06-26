'use client';

import axios from 'axios'; // axios'u import ettik
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'; // AxiosInstance ve InternalAxiosRequestConfig'ı import ettik

declare global { // global interface'i oluşturduk
  interface Window {
    location: Location;
  }
}

// BASE_URL'i oluşturduk
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api: AxiosInstance = axios.create({ // api objesi oluşturduk
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => { // api.interceptors.request.use fonksiyonu oluşturduk
  const token = localStorage.getItem('token'); // token'ı localStorage'ten aldık
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use( // api.interceptors.response.use fonksiyonu oluşturduk
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token'); // token'ı localStorage'ten sil
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; // api'yi döndük

export * from './auth';
export * from './profile';
export { enrollmentsApi } from './enrollments';
export type { EnrollmentHistory } from './enrollments';
export * from './courses';
export * from './lessons';
export * from './reviews';
