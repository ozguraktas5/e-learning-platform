import api from '../api';
import { Quiz, QuizAttempt } from '@/types/quiz';
import { AxiosError } from 'axios';

export interface ApiErrorResponse {
  error: string;
  not_found?: boolean;
  details?: string;
  message?: string;
}

export interface ApiQuizResults {
  quiz_title: string;
  quiz_description: string;
  total_attempts: number;
  results: Array<{
    attempt_id: number;
    started_at: string;
    completed_at: string | null;
    total_score: number;
    max_possible_score: number;
    percentage: number;
    answers: Array<{
      question_text: string;
      your_answer: string;
      correct_answer: string | null;
      points_earned: number;
      is_correct: boolean;
      question_id?: number;
      selected_option_id?: number | null;
    }>;
  }>;
}

export const quizApi = {
  // Quiz detaylarını getir
  getQuiz: async (courseId: number, lessonId: number, quizId: number): Promise<Quiz | ApiErrorResponse> => {
    try {
      const response = await api.get(`/courses/${courseId}/lessons/${lessonId}/quiz/${quizId}`);
      return response.data;
    } catch (error) {
      // 404 hatası olduğunda konsola yazdırmayıp özel bir yanıt döndür
      const axiosError = error as AxiosError;
      if (axiosError.response && axiosError.response.status === 404) {
        return {
          error: 'Quiz bulunamadı',
          not_found: true
        };
      }
      // Diğer hata tipleri için yeniden fırlat
      throw error;
    }
  },

  // Dersin tüm quizlerini getir
  getLessonQuizzes: async (courseId: number, lessonId: number): Promise<Quiz[]> => {
    const response = await api.get(`/courses/${courseId}/lessons/${lessonId}/quizzes`);
    return response.data;
  },

  // Yeni quiz oluştur
  createQuiz: async (courseId: number, lessonId: number, data: any): Promise<Quiz> => {
    const response = await api.post(`/courses/${courseId}/lessons/${lessonId}/quiz`, data);
    return response.data;
  },

  // Quiz'i sil
  deleteQuiz: async (courseId: number, lessonId: number, quizId: number): Promise<void> => {
    await api.delete(`/courses/${courseId}/lessons/${lessonId}/quiz/${quizId}`);
  },

  // Quiz'i güncelle
  updateQuiz: async (courseId: number, lessonId: number, quizId: number, data: any): Promise<Quiz> => {
    const response = await api.put(`/courses/${courseId}/lessons/${lessonId}/quiz/${quizId}`, data);
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
  getQuizResults: async (courseId: number, lessonId: number, quizId: number): Promise<ApiQuizResults | QuizAttempt[]> => {
    try {
      const response = await api.get(
        `/courses/${courseId}/lessons/${lessonId}/quiz/${quizId}/results`
      );
      return response.data;
    } catch (error) {
      // 404 hatası olduğunda özel bir mesaj döndür
      const axiosError = error as AxiosError;
      if (axiosError.response && axiosError.response.status === 404) {
        const responseData = axiosError.response.data as any;
        return {
          error: responseData.message || 'Bu quiz için henüz bir deneme bulunamadı',
          not_found: true
        } as ApiErrorResponse;
      }
      // Diğer hata tipleri için yeniden fırlat
      throw error;
    }
  }
};