import api from './index';

// Will be used when API endpoints are fully implemented
// import axios from './index';

export interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  max_points: number;
  created_at: string;
  updated_at: string;
  lesson_id: number;
  course_id: number;
  course_title: string;
  status: 'active' | 'expired' | 'draft';
  submissions_count: number;
  graded_count: number;
  submission_count?: number;
}

export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  user_id: number;
  submission_text: string;
  file_url: string | null;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  graded_at: string | null;
}

export interface AssignmentStats {
  total: number;
  active: number;
  pending_review: number;
  average_score: number;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: string;
}

export interface CreateAssignmentData {
  title: string;
  description: string;
  due_date: string; // ISO 8601 format: YYYY-MM-DDTHH:mm
  max_points: number;
  lesson_id: number;
}

export interface UpdateAssignmentData {
  title?: string;
  description?: string;
  due_date?: string;
  max_points?: number;
  is_published?: boolean;
}

export interface CourseWithLessons {
  id: number;
  title: string;
  lessons: {
    id: number;
    title: string;
  }[];
}

const getInstructorAssignments = async (): Promise<Assignment[]> => {
  try {
    const { data } = await api.get(`/instructor/assignments`);
    return data;
  } catch (error) {
    console.error('Error fetching instructor assignments:', error);
    throw error;
  }
};

const getAssignmentSubmissions = async (courseId: number, lessonId: number, assignmentId: number): Promise<AssignmentSubmission[]> => {
  try {
    const { data } = await api.get(`/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}/submissions`);
    return data;
  } catch (error) {
    console.error(`Error fetching submissions for assignment ${assignmentId}:`, error);
    throw error;
  }
};

const gradeSubmission = async (
  submissionId: number,
  grade: number,
  feedback: string
): Promise<{ success: boolean }> => {
  try {
    const { data } = await api.post(`/assignment-submissions/${submissionId}/grade`, {
      grade,
      feedback
    });
    return data;
  } catch (error) {
    console.error(`Error grading submission ${submissionId}:`, error);
    throw error;
  }
};

const getAssignmentStats = async (): Promise<AssignmentStats> => {
  try {
    const { data } = await api.get(`/instructor/assignments/stats`);
    return data;
  } catch (error) {
    console.error('Error fetching assignment statistics:', error);
    throw error;
  }
};

const getCreateAssignmentData = async (): Promise<{ courses: CourseWithLessons[] }> => {
  try {
    const { data } = await api.get(`/instructor/assignments/create`);
    return data;
  } catch (error) {
    console.error('Error fetching assignment creation data:', error);
    throw error;
  }
};

export const assignmentsApi = {
  getInstructorAssignments,
  getAssignmentSubmissions,
  gradeSubmission,
  getAssignmentStats,
  getCreateAssignmentData,
  // Get all assignments for a course
  getCourseAssignments: async (courseId: number): Promise<Assignment[]> => {
    const response = await api.get(`/courses/${courseId}/assignments`);
    return response.data;
  },

  // Get a single assignment
  getAssignment: async (courseId: number, lessonId: number, assignmentId: number): Promise<Assignment> => {
    const response = await api.get(`/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}`);
    return response.data;
  },

  // Create a new assignment
  createAssignment: async (courseId: number, data: CreateAssignmentData): Promise<Assignment> => {
    const response = await api.post(`/courses/${courseId}/assignments`, data);
    return response.data;
  },

  // Update an assignment
  updateAssignment: async (courseId: number, lessonId: number, assignmentId: number, data: UpdateAssignmentData): Promise<Assignment> => {
    const response = await api.put(`/api/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}`, data);
    return response.data;
  },

  // Delete an assignment
  deleteAssignment: async (courseId: number, lessonId: number, assignmentId: number): Promise<void> => {
    await api.delete(`/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}`);
  }
}; 