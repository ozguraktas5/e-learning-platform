// Will be used when API endpoints are fully implemented
import api from '../axios';

export interface StudentEnrollment {
  id: number;
  student: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  course: {
    id: number;
    title: string;
  };
  enrolled_at: string;
  progress: number;
  last_activity_at: string;
  completed: boolean;
}

export interface StudentStats {
  total_students: number;
  active_students: number;
  completions_this_month: number;
  average_course_completion: number;
}

export interface StudentProgress {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  courses: {
    id: number;
    title: string;
    progress: number;
    completed_lessons: number;
    total_lessons: number;
    last_activity: string;
    completed_assignments: number;
    total_assignments: number;
    average_grade: number;
  }[];
}

const getEnrolledStudents = async (): Promise<StudentEnrollment[]> => {
  try {
    const { data } = await api.get('/enrollments/instructor/students');
    return data;
  } catch (error) {
    console.error('Error fetching enrolled students:', error);
    throw error;
  }
};

const getStudentStats = async (): Promise<StudentStats> => {
  try {
    const { data } = await api.get('/enrollments/instructor/student-stats');
    return data;
  } catch (error) {
    console.error('Error fetching student statistics:', error);
    throw error;
  }
};

const getStudentProgress = async (studentId: number): Promise<StudentProgress> => {
  try {
    const { data } = await api.get(`/enrollments/instructor/students/${studentId}/progress`);
    return data;
  } catch (error) {
    console.error('Error fetching student progress:', error);
    throw error;
  }
};

export const instructorsApi = {
  getEnrolledStudents,
  getStudentStats,
  getStudentProgress
}; 