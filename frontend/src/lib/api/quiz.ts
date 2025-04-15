import api from '../api';
import { Quiz, QuizAttempt } from '@/types/quiz';

export const quizApi = {
  // Quiz detaylarını getir
  getQuiz: async (courseId: number, lessonId: number, quizId: number): Promise<Quiz> => {
    const response = await api.get(`/courses/${courseId}/lessons/${lessonId}/quiz/${quizId}`);
    return response.data;
  },

  // Yeni quiz oluştur
  createQuiz: async (courseId: number, lessonId: number, data: any): Promise<Quiz> => {
    const response = await api.post(`/courses/${courseId}/lessons/${lessonId}/quiz`, data);
    return response.data;
  },

  // Quiz'i çöz
  submitQuiz: async (courseId: number, lessonId: number, quizId: number, answers: any): Promise<QuizAttempt> => {
    const response = await api.post(
      `/courses/${courseId}/lessons/${lessonId}/quiz/${quizId}/submit`,
      { answers }
    );
    return response.data;
  },

  // Quiz sonuçlarını getir
  getQuizResults: async (courseId: number, lessonId: number, quizId: number): Promise<QuizAttempt[]> => {
    const response = await api.get(
      `/courses/${courseId}/lessons/${lessonId}/quiz/${quizId}/results`
    );
    return response.data;
  }
};