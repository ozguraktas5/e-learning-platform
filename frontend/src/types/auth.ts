export interface User { // User interface'i oluşturduk
  id: number;
  username: string;
  email: string;
  role: 'student' | 'instructor';
  created_at: string;
}

export interface LoginResponse { // LoginResponse interface'i oluşturduk
  access_token: string;
  user: User;
}

export interface RegisterData { // RegisterData interface'i oluşturduk
  username: string;
  email: string;
  password: string;
  role: 'student' | 'instructor';
}