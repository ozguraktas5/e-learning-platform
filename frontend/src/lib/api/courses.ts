import api from '@/lib/axios';

export interface CourseSearchParams {
  query?: string;
  category?: string;
  level?: string;
  min_price?: number;
  max_price?: number;
  instructor_id?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  instructor_id: number;
  instructor_name: string;
  image_url?: string;
  created_at: string;
  updated_at?: string;
  average_rating?: number;
  duration?: string;
}

export interface CourseEnrollment {
  id: number;
  course_id: number;
  user_id: number;
  enrolled_at: string;
  is_enrolled?: boolean;
}

export interface SearchResponse {
  courses: Course[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CreateCourseData {
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  instructor_id: number;
  image_url?: string;
}

export interface Lesson {
  id: number;
  title: string;
  content: string;
  order: number;
  video_url?: string | null; // Optional based on model nullable=True
  created_at: string; // ISO date string
  document_count?: number; // Optional, might not always be present
  quiz_count?: number; // Optional, might not always be present
  assignment_count?: number; // Optional, might not always be present
  // course_id is available in the model but not in to_dict, add if needed
} 

export const coursesApi = {
  searchCourses: async (params: CourseSearchParams = {}): Promise<SearchResponse> => {
    try {
      const response = await api.get('/courses/search', { 
        params,
        // Hata durumunda bile yanıtı almak için
        validateStatus: function (status) {
          return status >= 200 && status < 600;
        }
      });
      
      if (response.status >= 400) {
        throw new Error(response.data.message || 'Failed to search courses');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error searching courses:', error);
      throw error;
    }
  },

  getCourseById: async (courseId: string): Promise<Course> => {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
  },

  createCourse: async (courseData: FormData): Promise<Course> => {
    const response = await api.post('/courses', courseData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateCourse: async (courseId: string, courseData: FormData): Promise<Course> => {
    const response = await api.put(`/courses/${courseId}`, courseData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteCourse: async (courseId: string): Promise<void> => {
    const response = await api.delete(`/courses/${courseId}`);
    return response.data;
  },

  getCourse: async (courseId: number): Promise<Course> => {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
  },

  enrollInCourse: async (courseId: number): Promise<CourseEnrollment> => {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data;
  },

  checkEnrollment: async (courseId: number): Promise<{is_enrolled: boolean}> => {
    console.log(`API call: Checking enrollment for course ID ${courseId}`);
    try {
      const response = await api.get(`/courses/${courseId}/enrollment-status`);
      console.log(`API response for enrollment check:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`API error checking enrollment for course ${courseId}:`, error);
      throw error;
    }
  },

  getCategories: async (): Promise<string[]> => {
    const response = await api.get('/courses/categories');
    return response.data;
  },

  getInstructors: async (): Promise<{ id: number; username: string; email: string }[]> => {
    const response = await api.get('/courses/instructors');
    return response.data;
  },

  getAllCourses: async (): Promise<Course[]> => {
    const response = await api.get('/courses');
    return response.data;
  },

  getCourseLessons: async (courseId: number): Promise<Lesson[]> => {
    try {
      const response = await api.get(`/courses/${courseId}/lessons`);
      // Ensure the response data is an array, default to empty array if not
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error(`Error fetching lessons for course ${courseId}:`, error);
      // Re-throw the error or return an empty array/handle as needed
      throw error; 
    }
  },
};