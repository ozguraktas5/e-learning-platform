import api from '@/lib/axios';

export interface Profile {
  id: number;
  username: string;
  email: string;
  role: 'student' | 'instructor';
  created_at: string;
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

export const profileApi = {
  getProfile: async (): Promise<Profile> => {
    const response = await api.get('/profile');
    return response.data;
  },
  updateProfile: async (
    data: UpdateProfileData
  ): Promise<{ message: string; profile: Profile }> => {
    const response = await api.put('/profile', data);
    return response.data;
  },
  changePassword: async (
    data: ChangePasswordData
  ): Promise<{ message: string }> => {
    const response = await api.put('/profile/password', data);
    return response.data;
  },
}; 