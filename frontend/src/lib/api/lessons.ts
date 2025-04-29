import api from '../api';
import { Lesson, CreateLessonData, UpdateLessonData } from '@/types/lesson';

export const lessonApi = {
  // Ders listesini getir
  getLessons: async (courseId: number): Promise<Lesson[]> => {
    const response = await api.get(`/courses/${courseId}/lessons`);
    return response.data;
  },

  // Ders detayını getir
  getLesson: async (courseId: number, lessonId: number): Promise<Lesson> => {
    const response = await api.get(`/courses/${courseId}/lessons/${lessonId}`);
    return response.data;
  },

  // Yeni ders oluştur
  createLesson: async (courseId: number, data: CreateLessonData): Promise<Lesson> => {
    const response = await api.post(`/courses/${courseId}/lessons`, data);
    if (response.data && response.data.lesson) {
      return response.data.lesson;
    } else {
      console.error('Unexpected response structure from createLesson API:', response.data);
      throw new Error('Failed to create lesson: Invalid API response');
    }
  },

  // Ders güncelle
  updateLesson: async (courseId: number, lessonId: number, data: UpdateLessonData): Promise<Lesson> => {
    const response = await api.put(`/courses/${courseId}/lessons/${lessonId}`, data);
    return response.data;
  },

  // Ders sil
  deleteLesson: async (courseId: number, lessonId: number): Promise<void> => {
    await api.delete(`/courses/${courseId}/lessons/${lessonId}`);
  },

  // Ders medyası yükle
  uploadMedia: async (courseId: number, lessonId: number, formData: FormData): Promise<any> => {
    const response = await api.post(
      `/courses/${courseId}/lessons/${lessonId}/media`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};