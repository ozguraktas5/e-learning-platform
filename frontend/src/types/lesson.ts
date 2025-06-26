export interface Lesson { // Lesson interface'i oluşturduk
  id: number;
  title: string;
  content: string;
  order: number;
  course_id: number;
  video_url?: string;
  created_at: string;
  updated_at: string;
  documents: LessonDocument[];
  quizzes?: any[];
}

export interface LessonDocument { // LessonDocument interface'i oluşturduk
  id: number;
  lesson_id: number;
  file_url: string;
  file_name: string;
  created_at: string;
}

export interface CreateLessonData { // CreateLessonData interface'i oluşturduk
  title: string;
  content: string;
  order: number;
}

export interface UpdateLessonData extends Partial<CreateLessonData> {} // UpdateLessonData interface'i oluşturduk