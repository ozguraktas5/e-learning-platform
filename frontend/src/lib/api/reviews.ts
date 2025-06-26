import api from '@/lib/axios'; // api'yi import ettik

export interface Review { // Review interface'i oluşturduk
  id: number;
  course_id: number;
  user_id: number;
  rating: number;
  comment: string;
  created_at: string;
  updated_at?: string;
  instructor_reply?: string;
  instructor_reply_date?: string;
  username?: string;
}

export interface CourseReviewsResponse { // CourseReviewsResponse interface'i oluşturduk
  course_id: number;
  average_rating: number;
  total_reviews: number;
  reviews: Review[];
}

export interface CreateReviewData { // CreateReviewData interface'i oluşturduk
  rating: number;
  comment: string;
}

export interface ReplyData { // ReplyData interface'i oluşturduk
  reply: string;
}

export const reviewsApi = { // reviewsApi objesi oluşturduk
  // Kurs değerlendirmelerini getir
  getCourseReviews: async (courseId: number): Promise<CourseReviewsResponse> => { // getCourseReviews fonksiyonu oluşturduk
    try {
      const response = await api.get(`/courses/${courseId}/reviews`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course reviews:', error);
      throw error;
    }
  },

  // Yeni değerlendirme oluştur
  createReview: async (courseId: number, reviewData: CreateReviewData): Promise<Review> => { // createReview fonksiyonu oluşturduk
    try {
      const response = await api.post(`/courses/${courseId}/reviews`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  },

  // Değerlendirmeyi güncelle
  updateReview: async (courseId: number, reviewId: number, reviewData: CreateReviewData): Promise<Review> => { // updateReview fonksiyonu oluşturduk
    try {
      const response = await api.put(`/courses/${courseId}/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  },

  // Değerlendirmeyi sil
  deleteReview: async (courseId: number, reviewId: number): Promise<{ message: string }> => { // deleteReview fonksiyonu oluşturduk
    try {
      const response = await api.delete(`/courses/${courseId}/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  },

  // Değerlendirmeye yanıt ver (eğitmen için)
  replyToReview: async (courseId: number, reviewId: number, replyData: ReplyData): Promise<Review> => { // replyToReview fonksiyonu oluşturduk
    try {
      const response = await api.post(`/courses/${courseId}/reviews/${reviewId}/reply`, replyData);
      return response.data.review;
    } catch (error) {
      console.error('Error replying to review:', error);
      throw error;
    }
  }
}; 