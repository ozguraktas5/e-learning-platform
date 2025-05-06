import api from '../api';
import { AxiosError } from 'axios';

export interface Assignment {
  id: number;
  title: string;
  description: string;
  lesson_id: number;
  lesson_title?: string;
  course_title?: string;
  due_date: string;
  max_points: number;
  created_at: string;
  submission_count?: number;
}

export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  user_id: number;
  submission_text?: string;
  file_url?: string;
  submitted_at: string;
  grade?: number;
  feedback?: string;
  graded_at?: string;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: string;
}

export const assignmentsApi = {
  // Ders için tüm ödevleri getir
  getLessonAssignments: async (courseId: number, lessonId: number): Promise<Assignment[]> => {
    try {
      const response = await api.get(`/courses/${courseId}/lessons/${lessonId}/assignments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  },

  // Belirli bir ödevi getir
  getAssignment: async (courseId: number, lessonId: number, assignmentId: number): Promise<Assignment> => {
    try {
      const response = await api.get(`/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching assignment:', error);
      throw error;
    }
  },

  // Yeni ödev oluştur
  createAssignment: async (courseId: number, lessonId: number, assignmentData: Partial<Assignment>): Promise<Assignment> => {
    try {
      const response = await api.post(`/courses/${courseId}/lessons/${lessonId}/assignment`, assignmentData);
      return response.data;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  },

  // Ödev gönderimi yap
  submitAssignment: async (courseId: number, lessonId: number, assignmentId: number, submissionData: { text: string }): Promise<{ message: string; submission_id: number }> => {
    try {
      const response = await api.post(
        `/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}/submit`,
        submissionData
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting assignment:', error);
      throw error;
    }
  },

  // Ödev gönderimlerini getir (eğitmen için)
  getAssignmentSubmissions: async (courseId: number, lessonId: number, assignmentId: number): Promise<AssignmentSubmission[]> => {
    try {
      const response = await api.get(`/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}/submissions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching assignment submissions:', error);
      throw error;
    }
  },

  // Belirli bir ödev gönderimini getir
  getSubmission: async (courseId: number, lessonId: number, assignmentId: number, submissionId: number): Promise<AssignmentSubmission> => {
    try {
      const response = await api.get(
        `/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}/submission/${submissionId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching submission:', error);
      throw error;
    }
  },

  // Ödev değerlendirme (eğitmen için)
  gradeSubmission: async (
    courseId: number, 
    lessonId: number, 
    assignmentId: number, 
    submissionId: number, 
    gradeData: { grade: number; feedback?: string }
  ): Promise<{ message: string; submission: AssignmentSubmission }> => {
    try {
      const response = await api.post(
        `/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}/submission/${submissionId}/grade`,
        gradeData
      );
      return response.data;
    } catch (error) {
      console.error('Error grading submission:', error);
      throw error;
    }
  },

  // Ödevi sil (eğitmen için)
  deleteAssignment: async (courseId: number, lessonId: number, assignmentId: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(
        `/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting assignment:', error);
      throw error;
    }
  }
}; 