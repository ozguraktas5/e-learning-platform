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
  id: string;
  title: string;
  description: string;
  price: number;
  instructor_id: string;
  created_at: string;
  updated_at: string;
  category: string;
  level: string;
  image_url?: string;
}

export interface SearchResponse {
  courses: Course[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export const coursesApi = {
  searchCourses: async (params: CourseSearchParams = {}): Promise<SearchResponse> => {
    const response = await api.get('/courses/search', { params });
    return response.data;
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
};