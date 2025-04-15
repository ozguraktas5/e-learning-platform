export interface Course {
  id: number;
  title: string;
  description: string;
  instructor_id: number;
  instructor: {
    id: number;
    username: string;
    email: string;
  };
  category: string;
  level: string;
  price: number;
  created_at: string;
  updated_at: string;
  enrollment_count: number;
}

export interface CreateCourseData {
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
}

export interface UpdateCourseData extends Partial<CreateCourseData> {}