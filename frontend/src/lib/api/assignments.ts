import api from '../api';
import { AxiosError } from 'axios';

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

const getInstructorAssignments = async (): Promise<Assignment[]> => {
  try {
    // When API is ready, uncomment this
    // const { data } = await axios.get('/assignments/instructor');
    // return data;
    
    // For now, return mock data
    return getMockAssignments();
  } catch (error) {
    console.error('Error fetching instructor assignments:', error);
    throw error;
  }
};

const getAssignmentSubmissions = async (assignmentId: number): Promise<AssignmentSubmission[]> => {
  try {
    // When API is ready, uncomment this
    // const { data } = await axios.get(`/assignments/${assignmentId}/submissions`);
    // return data;
    
    // For now, return mock data
    return getMockSubmissions(assignmentId);
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
    // When API is ready, uncomment this
    // const { data } = await axios.post(`/assignment-submissions/${submissionId}/grade`, {
    //   grade,
    //   feedback
    // });
    // return data;
    
    // For now, return mock success
    return { success: true };
  } catch (error) {
    console.error(`Error grading submission ${submissionId}:`, error);
    throw error;
  }
};

const getAssignmentStats = async (): Promise<AssignmentStats> => {
  try {
    // When API is ready, uncomment this
    // const { data } = await axios.get('/assignments/instructor/stats');
    // return data;
    
    // For now, return mock stats
    return {
      total: 14,
      active: 8,
      pending_review: 23,
      average_score: 78
    };
  } catch (error) {
    console.error('Error fetching assignment statistics:', error);
    throw error;
  }
};

// Mock data helper functions
function getMockAssignments(): Assignment[] {
  const courseNames = [
    'Frontend Web Geliştirme', 'Backend Web Geliştirme', 'Veri Bilimi Temelleri',
    'Python Programlama', 'JavaScript Temelleri', 'React.js ile Modern UI',
    'Node.js ile API Geliştirme', 'SQL ve Veritabanı Tasarımı'
  ];
  
  const assignmentTitles = [
    'Haftalık Kod Ödevi', 'Proje Çalışması', 'Vaka Analizi',
    'Mini Proje', 'Kodlama Egzersizi', 'Final Projesi',
    'Kısa Sınav', 'Araştırma Ödevi'
  ];
  
  const assignments: Assignment[] = [];
  
  for (let i = 0; i < 20; i++) {
    const courseId = 200 + (i % courseNames.length);
    const courseTitle = courseNames[i % courseNames.length];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) - 10); // -10 to +20 days
    
    const createdDate = new Date(dueDate);
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 14) - 7); // 7-21 days before due date
    
    const status: Assignment['status'] = 
      dueDate < new Date() ? 'expired' : 
      Math.random() > 0.2 ? 'active' : 'draft';
    
    const submissionsCount = Math.floor(Math.random() * 30) + 5;
    const gradedCount = status === 'expired' 
      ? Math.floor(submissionsCount * (0.7 + Math.random() * 0.3)) 
      : Math.floor(submissionsCount * Math.random() * 0.8);
    
    assignments.push({
      id: 1000 + i,
      title: `${assignmentTitles[i % assignmentTitles.length]} ${i + 1}`,
      description: `${courseTitle} dersi için ${assignmentTitles[i % assignmentTitles.length].toLowerCase()}.`,
      course_id: courseId,
      course_title: courseTitle,
      due_date: dueDate.toISOString(),
      created_at: createdDate.toISOString(),
      status,
      max_points: [10, 20, 25, 50, 100][Math.floor(Math.random() * 5)],
      submissions_count: submissionsCount,
      graded_count: gradedCount
    });
  }
  
  return assignments;
}

function getMockSubmissions(assignmentId: number): AssignmentSubmission[] {
  const names = [
    'Ahmet Yılmaz', 'Ayşe Kaya', 'Mehmet Demir', 'Fatma Şahin', 
    'Ali Özdemir', 'Zeynep Çelik', 'Mustafa Yıldız', 'Ebru Kara',
    'Hakan Koç', 'Seda Arslan', 'Cem Aydın', 'Nil Doğan',
    'Serkan Yücel', 'Deniz Şen', 'Gökhan Tekin', 'Ece Yalçın',
    'Burak Yavuz', 'Elif Öztürk', 'Onur Aksoy', 'Gizem Aktaş'
  ];
  
  const submissions: AssignmentSubmission[] = [];
  const submissionCount = 5 + Math.floor(Math.random() * 15);
  
  for (let i = 0; i < submissionCount; i++) {
    const submittedDate = new Date();
    submittedDate.setDate(submittedDate.getDate() - Math.floor(Math.random() * 10));
    
    let status: AssignmentSubmission['status'] = 'submitted';
    let gradedAt: string | undefined = undefined;
    let grade: number | undefined = undefined;
    let feedback: string | undefined = undefined;
    
    if (Math.random() > 0.4) {
      status = 'graded';
      const gradedDate = new Date(submittedDate);
      gradedDate.setDate(gradedDate.getDate() + Math.floor(Math.random() * 3) + 1);
      gradedAt = gradedDate.toISOString();
      grade = Math.floor(Math.random() * 101);
      feedback = [
        'İyi bir çalışma, temel kavramları anlamışsınız.',
        'Kodunuz çalışıyor ama daha optimize edilebilir.',
        'Mükemmel çalışma, tüm gereksinimleri karşıladınız.',
        'Temel gereksinimler karşılandı ama daha fazla açıklama gerekiyor.',
        'Ödev zamanında teslim edildi ama bazı eksiklikler var.'
      ][Math.floor(Math.random() * 5)];
    } else if (Math.random() > 0.7) {
      status = 'resubmitted';
    } else if (Math.random() > 0.5) {
      status = 'late';
    }
    
    // Rastgele ekli dosyalar
    const attachmentsCount = Math.floor(Math.random() * 3);
    const attachments = [];
    
    for (let j = 0; j < attachmentsCount; j++) {
      const fileTypes = ['pdf', 'docx', 'zip', 'jpg', 'txt'];
      const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
      
      attachments.push({
        id: 5000 + (i * 10) + j,
        name: `assignment_${i+1}_file_${j+1}.${fileType}`,
        url: `/uploads/assignments/${assignmentId}/student_${2000+i}/${5000 + (i * 10) + j}.${fileType}`,
        type: fileType === 'pdf' ? 'application/pdf' : 
              fileType === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
              fileType === 'zip' ? 'application/zip' :
              fileType === 'jpg' ? 'image/jpeg' : 'text/plain'
      });
    }
    
    submissions.push({
      id: 2000 + i,
      assignment_id: assignmentId,
      student: {
        id: 100 + i,
        name: names[i % names.length],
        email: names[i % names.length].toLowerCase().replace(' ', '.') + '@example.com',
        avatar: Math.random() > 0.3 ? `/assets/avatars/avatar-${(i % 10) + 1}.png` : undefined
      },
      submitted_at: submittedDate.toISOString(),
      status,
      content: `Bu ödev için ${Math.floor(Math.random() * 3) + 1} saatimi harcadım. ${
        Math.random() > 0.5 ? 'Zorlandığım kısımlar oldu ama sonunda tamamladım.' : 'Konuyu iyi anladığım için kolay tamamladım.'
      }`,
      attachments: attachments.length > 0 ? attachments : undefined,
      grade,
      feedback,
      graded_at: gradedAt
    });
  }
  
  return submissions;
}

export const assignmentsApi = {
  getInstructorAssignments,
  getAssignmentSubmissions,
  gradeSubmission,
  getAssignmentStats
}; 