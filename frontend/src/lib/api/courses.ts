import api from '../api';
import { Course, CreateCourseData, UpdateCourseData } from '@/types/course';

export const courseApi = {
  // Kurs listesini getir
  getCourses: async (params?: {
    q?: string;
    category?: string;
    instructor_id?: number;
    sort_by?: string;
    order?: 'asc' | 'desc';
  }) => {
    const response = await api.get('/courses/search', { params });
    return response.data;
  },

  // Kurs detayını getir
  getCourse: async (id: number): Promise<Course> => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  // Yeni kurs oluştur
  createCourse: async (data: CreateCourseData): Promise<Course> => {
    const response = await api.post('/courses', data);
    return response.data;
  },

  // Kurs güncelle
  updateCourse: async (id: number, data: UpdateCourseData): Promise<Course> => {
    const response = await api.put(`/courses/${id}`, data);
    return response.data;
  },

  // Kursa kayıt ol
  enrollCourse: async (courseId: number): Promise<void> => {
  await api.post(`/courses/${courseId}/enroll`);
  },

  // Kurs sil
  deleteCourse: async (courseId: number): Promise<void> => {
  await api.delete(`/courses/${courseId}`);
  },
};