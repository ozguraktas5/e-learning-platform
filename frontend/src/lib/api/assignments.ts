import api from '../axios';

// Will be used when API endpoints are fully implemented
// import axios from './index';

export interface Assignment {
  id: number;
  title: string;
  description: string;
  course_id: number;
  course_title: string;
  due_date: string;
  created_at: string;
  status: 'active' | 'expired' | 'draft';
  max_points: number;
  submissions_count: number;
  graded_count: number;
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
  lesson_id: number;
  due_date: string;
  max_points: number;
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
    const { data } = await api.get('/instructor/assignments');
    return data;
  } catch (error) {
    console.error('Error fetching instructor assignments:', error);
    throw error;
  }
};

const getAssignmentSubmissions = async (assignmentId: number): Promise<AssignmentSubmission[]> => {
  try {
    const { data } = await api.get(`/assignments/${assignmentId}/submissions`);
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
    const { data } = await api.get('/instructor/assignments/stats');
    return data;
  } catch (error) {
    console.error('Error fetching assignment statistics:', error);
    throw error;
  }
};

const getCreateAssignmentData = async (): Promise<{ courses: CourseWithLessons[] }> => {
  try {
    const { data } = await api.get('/instructor/assignments/create');
    return data;
  } catch (error) {
    console.error('Error fetching assignment creation data:', error);
    throw error;
  }
};

const createAssignment = async (assignmentData: CreateAssignmentData): Promise<Assignment> => {
  try {
    const { data } = await api.post('/instructor/assignments/create', assignmentData);
    return data.assignment;
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
};

export const assignmentsApi = {
  getInstructorAssignments,
  getAssignmentSubmissions,
  gradeSubmission,
  getAssignmentStats,
  getCreateAssignmentData,
  createAssignment
}; 