import api from '../api';

export interface Course {
  id: number;
  title: string;
  description: string;
  instructor_id: number;
  instructor_name: string;
  created_at: string;
  image_url?: string;
  price?: number;
  category?: string;
  level?: string;
}

export interface CreateCourseData {
  title: string;
  description: string;
  price?: number;
  category?: string;
  level?: string;
}

export const coursesApi = {
  getCourses: async (): Promise<Course[]> => {
    const token = localStorage.getItem('token');
    const response = await api.get('/api/courses/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  createCourse: async (data: CreateCourseData): Promise<Course> => {
    const token = localStorage.getItem('token');
    const response = await api.post('/api/courses/', data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  getCourse: async (id: number): Promise<Course> => {
    const response = await api.get(`/api/courses/${id}`);
    return response.data;
  },

  updateCourse: async (id: number, data: Partial<CreateCourseData>): Promise<Course> => {
    const response = await api.put(`/api/courses/${id}`, data);
    return response.data;
  },

  deleteCourse: async (id: number): Promise<void> => {
    await api.delete(`/api/courses/${id}`);
  },
};