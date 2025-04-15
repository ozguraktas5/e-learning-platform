export interface User {
  id: number;
  username: string;
  email: string;
  role: 'student' | 'instructor';
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: 'student' | 'instructor';
}