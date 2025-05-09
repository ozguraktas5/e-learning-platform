import axios from './index';

export interface Course {
  id: number;
  title: string;
  description: string;
  image_url: string;
  instructor_name: string;
  progress?: number;
  enrolled_at: string;
  last_activity_at?: string;
}

export interface EnrollmentHistory {
  id: number;
  course_id: number;
  course_title: string;
  instructor_name: string;
  enrolled_at: string;
  status: 'active' | 'completed' | 'cancelled';
  completed_at?: string;
  certificate_id?: string;
}

const getEnrolledCourses = async (): Promise<Course[]> => {
  const { data } = await axios.get('/enrollments/courses');
  return data;
};

const getEnrollmentHistory = async (): Promise<EnrollmentHistory[]> => {
  const { data } = await axios.get('/enrollments/history');
  return data;
};

const enrollInCourse = async (courseId: number): Promise<{ message: string }> => {
  const { data } = await axios.post(`/courses/${courseId}/enroll`);
  return data;
};

export const enrollmentsApi = {
  getEnrolledCourses,
  getEnrollmentHistory,
  enrollInCourse
}; 