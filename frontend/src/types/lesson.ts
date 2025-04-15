export interface Lesson {
  id: number;
  title: string;
  content: string;
  order: number;
  course_id: number;
  video_url?: string;
  created_at: string;
  updated_at: string;
  documents: LessonDocument[];
}

export interface LessonDocument {
  id: number;
  lesson_id: number;
  file_url: string;
  file_name: string;
  created_at: string;
}

export interface CreateLessonData {
  title: string;
  content: string;
  order: number;
}

export interface UpdateLessonData extends Partial<CreateLessonData> {}