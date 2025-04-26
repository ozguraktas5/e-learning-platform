import api from '@/lib/axios';

export interface MyCourseEnrollment {
  enrollment_id: number;
  course: {
    id: number;
    title: string;
    description: string;
    instructor: string;
    progress: {
      completed_lessons: number;
      total_lessons: number;
    };
  };
}

export const enrollmentApi = {
  // Get courses the user is enrolled in
  getMyCourses: async (): Promise<MyCourseEnrollment[]> => {
    const response = await api.get('/my-courses');
    return response.data;
  },
}; 