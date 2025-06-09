import axios from 'axios';
import { API_URL } from '@/config';

// Will be used when API endpoints are fully implemented
// import axios from './index';

export interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  total_points: number;
  created_at: string;
  updated_at: string;
}

export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  student: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  submitted_at: string;
  status: 'submitted' | 'graded' | 'late' | 'resubmitted';
  content: string;
  attachments?: {
    id: number;
    name: string;
    url: string;
    type: string;
  }[];
  grade?: number;
  feedback?: string;
  graded_at?: string;
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
  due_date: string;
  total_points: number;
}

export interface UpdateAssignmentData {
  title?: string;
  description?: string;
  due_date?: string;
  total_points?: number;
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
    const { data } = await axios.get(`${API_URL}/instructor/assignments`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return data;
  } catch (error) {
    console.error('Error fetching instructor assignments:', error);
    throw error;
  }
};

const getAssignmentSubmissions = async (assignmentId: number): Promise<AssignmentSubmission[]> => {
  try {
    const { data } = await axios.get(`${API_URL}/assignments/${assignmentId}/submissions`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
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
    const { data } = await axios.post(`${API_URL}/assignment-submissions/${submissionId}/grade`, {
      grade,
      feedback
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return data;
  } catch (error) {
    console.error(`Error grading submission ${submissionId}:`, error);
    throw error;
  }
};

const getAssignmentStats = async (): Promise<AssignmentStats> => {
  try {
    const { data } = await axios.get(`${API_URL}/instructor/assignments/stats`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return data;
  } catch (error) {
    console.error('Error fetching assignment statistics:', error);
    throw error;
  }
};

const getCreateAssignmentData = async (): Promise<{ courses: CourseWithLessons[] }> => {
  try {
    const { data } = await axios.get(`${API_URL}/instructor/assignments/create`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
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
    const response = await axios.get(`${API_URL}/courses/${courseId}/assignments`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  // Get a single assignment
  getAssignment: async (courseId: number, assignmentId: number): Promise<Assignment> => {
    const response = await axios.get(`${API_URL}/courses/${courseId}/assignments/${assignmentId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  // Create a new assignment
  createAssignment: async (courseId: number, data: CreateAssignmentData): Promise<Assignment> => {
    const response = await axios.post(`${API_URL}/courses/${courseId}/assignments`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  // Update an assignment
  updateAssignment: async (courseId: number, assignmentId: number, data: UpdateAssignmentData): Promise<Assignment> => {
    const response = await axios.put(`${API_URL}/courses/${courseId}/assignments/${assignmentId}`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  // Delete an assignment
  deleteAssignment: async (courseId: number, assignmentId: number): Promise<void> => {
    await axios.delete(`${API_URL}/courses/${courseId}/assignments/${assignmentId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  }
}; 