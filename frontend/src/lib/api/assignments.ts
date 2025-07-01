import api from './index'; // api'yi import ettik

export interface Assignment { // Assignment interface'i oluşturduk
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

export interface AssignmentSubmission { // AssignmentSubmission interface'i oluşturduk
  id: number;
  assignment_id: number;
  user_id: number;
  submission_text: string;
  content?: string;
  file_url: string | null;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  graded_at: string | null;
  status: 'submitted' | 'graded' | 'pending' | 'late' | 'resubmitted';
  attachments?: {
    id: number;
    url: string;
    name?: string;
    type?: string;
  }[];
  student: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface AssignmentStats { // AssignmentStats interface'i oluşturduk
  total: number;
  active: number;
  pending_review: number;
  average_score: number;
}

export interface ApiErrorResponse { // ApiErrorResponse interface'i oluşturduk
  error: string;
  message?: string;
  details?: string;
}

export interface CreateAssignmentData { // CreateAssignmentData interface'i oluşturduk
  title: string;
  description: string;
  due_date: string;
  max_points: number;
  lesson_id: number;
}

export interface UpdateAssignmentData { // UpdateAssignmentData interface'i oluşturduk
  title?: string;
  description?: string;
  due_date?: string;
  max_points?: number;
  is_published?: boolean;
}

export interface CourseWithLessons { // CourseWithLessons interface'i oluşturduk
  id: number;
  title: string;
  lessons: {
    id: number;
    title: string;
  }[];
}

const getInstructorAssignments = async (): Promise<Assignment[]> => { // getInstructorAssignments fonksiyonu oluşturduk
  try {
    const { data } = await api.get(`/instructor/assignments`);
    return data;
  } catch (error) {
    console.error('Error fetching instructor assignments:', error);
    throw error;
  }
};

const getAssignmentSubmissions = async (courseId: number, lessonId: number, assignmentId: number): Promise<AssignmentSubmission[]> => { // getAssignmentSubmissions fonksiyonu oluşturduk
  try {
    const { data } = await api.get(`/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}/submissions`);
    return data;
  } catch (error) {
    console.error(`Error fetching submissions for assignment ${assignmentId}:`, error);
    throw error;
  }
};

// Instructor dashboard için - sadece assignment ID ile
const getAssignmentSubmissionsByAssignmentId = async (assignmentId: number): Promise<AssignmentSubmission[]> => {
  try {
    const { data } = await api.get(`/instructor/assignments/${assignmentId}/submissions`);
    return data;
  } catch (error) {
    console.error(`Error fetching submissions for assignment ${assignmentId}:`, error);
    throw error;
  }
};

const gradeSubmission = async ( // gradeSubmission fonksiyonu oluşturduk
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

const getAssignmentStats = async (): Promise<AssignmentStats> => { // getAssignmentStats fonksiyonu oluşturduk
  try {
    const { data } = await api.get(`/instructor/assignments/stats`);
    return data;
  } catch (error) {
    console.error('Error fetching assignment statistics:', error);
    throw error;
  }
};

const getCreateAssignmentData = async (): Promise<{ courses: CourseWithLessons[] }> => { // getCreateAssignmentData fonksiyonu oluşturduk
  try {
    const { data } = await api.get(`/instructor/assignments/create`);
    return data;
  } catch (error) {
    console.error('Error fetching assignment creation data:', error);
    throw error;
  }
};

export const assignmentsApi = { // assignmentsApi objesi oluşturduk
  getInstructorAssignments,
  getAssignmentSubmissions,
  getAssignmentSubmissionsByAssignmentId,
  gradeSubmission,
  getAssignmentStats,
  getCreateAssignmentData,
  
  getCourseAssignments: async (courseId: number): Promise<Assignment[]> => { // getCourseAssignments fonksiyonu oluşturduk
    const response = await api.get(`/courses/${courseId}/assignments`);
    return response.data;
  },

  getLessonAssignments: async (courseId: number, lessonId: number): Promise<Assignment[]> => { // getLessonAssignments fonksiyonu oluşturduk
    const response = await api.get(`/courses/${courseId}/lessons/${lessonId}/assignments`);
    return response.data;
  },

  getAssignment: async (courseId: number, lessonId: number, assignmentId: number): Promise<Assignment> => { // getAssignment fonksiyonu oluşturduk
    const response = await api.get(`/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}`);
    return response.data;
  },

  createAssignment: async (courseId: number, data: CreateAssignmentData): Promise<Assignment> => { // createAssignment fonksiyonu oluşturduk
    const response = await api.post(`/courses/${courseId}/assignments`, data); 
    return response.data;
  },
 
  updateAssignment: async (courseId: number, lessonId: number, assignmentId: number, data: UpdateAssignmentData): Promise<Assignment> => { // updateAssignment fonksiyonu oluşturduk
    const response = await api.put(`/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}`, data);
    return response.data;
  },

  deleteAssignment: async (courseId: number, lessonId: number, assignmentId: number): Promise<void> => { // deleteAssignment fonksiyonu oluşturduk
    await api.delete(`/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}`);
  },

  submitAssignment: async (courseId: number, lessonId: number, assignmentId: number, data: { text: string }): Promise<void> => { // submitAssignment fonksiyonu oluşturduk
    await api.post(`/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}/submit`, data);
  },

  getUserSubmission: async (courseId: number, lessonId: number, assignmentId: number): Promise<AssignmentSubmission> => { // getUserSubmission fonksiyonu oluşturduk
    const response = await api.get(`/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}/my-submission`);
    return response.data;
  }
}; 