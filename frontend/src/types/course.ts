export interface Course { // Course interface'i oluşturduk
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

export interface CreateCourseData { // CreateCourseData interface'i oluşturduk
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
}

export interface UpdateCourseData extends Partial<CreateCourseData> {} // UpdateCourseData interface'i oluşturduk