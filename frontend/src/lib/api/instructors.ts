// Will be used when API endpoints are fully implemented
// import axios from './index';

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

const getEnrolledStudents = async (): Promise<StudentEnrollment[]> => {
  try {
    // When API is ready, uncomment this
    // const { data } = await axios.get('/enrollments/instructor/students');
    // return data;
    
    // For now, return mock data
    return getMockStudents();
  } catch (error) {
    console.error('Error fetching enrolled students:', error);
    throw error;
  }
};

const getStudentStats = async (): Promise<StudentStats> => {
  try {
    // When API is ready, uncomment this
    // const { data } = await axios.get('/enrollments/instructor/student-stats');
    // return data;
    
    // For now, return mock data
    return {
      total_students: 124,
      active_students: 87,
      completions_this_month: 13,
      average_course_completion: 68
    };
  } catch (error) {
    console.error('Error fetching student statistics:', error);
    throw error;
  }
};

// Mock data helper function - to be removed when API is ready
function getMockStudents(): StudentEnrollment[] {
  const names = [
    'Ahmet Yılmaz', 'Ayşe Kaya', 'Mehmet Demir', 'Fatma Şahin', 
    'Ali Özdemir', 'Zeynep Çelik', 'Mustafa Yıldız', 'Ebru Kara',
    'Hakan Koç', 'Seda Arslan', 'Cem Aydın', 'Nil Doğan',
    'Serkan Yücel', 'Deniz Şen', 'Gökhan Tekin', 'Ece Yalçın',
    'Burak Yavuz', 'Elif Öztürk', 'Onur Aksoy', 'Gizem Aktaş'
  ];
  
  const courseNames = [
    'Frontend Web Geliştirme', 'Backend Web Geliştirme', 'Veri Bilimi Temelleri',
    'Python Programlama', 'JavaScript Temelleri', 'React.js ile Modern UI',
    'Node.js ile API Geliştirme', 'SQL ve Veritabanı Tasarımı'
  ];
  
  const students: StudentEnrollment[] = [];
  
  for (let i = 0; i < 50; i++) {
    const enrolledDate = new Date();
    enrolledDate.setDate(enrolledDate.getDate() - Math.floor(Math.random() * 60));
    
    const lastActivityDate = new Date();
    lastActivityDate.setDate(lastActivityDate.getDate() - Math.floor(Math.random() * 14));
    
    const progress = Math.floor(Math.random() * 101);
    const completed = progress === 100;
    
    students.push({
      id: i + 1,
      student: {
        id: 100 + i,
        name: names[i % names.length],
        email: names[i % names.length].toLowerCase().replace(' ', '.') + '@example.com',
        avatar: Math.random() > 0.3 ? `/assets/avatars/avatar-${(i % 10) + 1}.png` : undefined
      },
      course: {
        id: 200 + (i % courseNames.length),
        title: courseNames[i % courseNames.length]
      },
      enrolled_at: enrolledDate.toISOString(),
      progress,
      last_activity_at: lastActivityDate.toISOString(),
      completed
    });
  }
  
  return students;
}

export const instructorsApi = {
  getEnrolledStudents,
  getStudentStats
}; 