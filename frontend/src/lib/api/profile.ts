import axios from './index';

interface ProfileResponse {
  username: string;
  email: string;
}

interface InstructorProfileResponse extends ProfileResponse {
  bio?: string;
  expertise?: string;
  socialMediaLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
  };
}

interface ProfileUpdateBody {
  username: string;
  email: string;
}

interface InstructorProfileUpdateBody extends ProfileUpdateBody {
  bio?: string;
  expertise?: string;
  socialMediaLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
  };
}

interface MessageResponse {
  message: string;
}

const getProfile = async (): Promise<ProfileResponse> => {
  const { data } = await axios.get('/profile');
  return data;
};

const updateProfile = async (body: ProfileUpdateBody): Promise<MessageResponse> => {
  const { data } = await axios.put('/profile', body);
  return data;
};

const updatePassword = async (body: { currentPassword: string; newPassword: string }): Promise<MessageResponse> => {
  const { data } = await axios.put('/profile/password', body);
  return data;
};

const getInstructorProfile = async (): Promise<InstructorProfileResponse> => {
  const { data } = await axios.get('/instructor/profile');
  return data;
};

const updateInstructorProfile = async (body: InstructorProfileUpdateBody): Promise<MessageResponse> => {
  const { data } = await axios.put('/instructor/profile', body);
  return data;
};

export const profileApi = {
  getProfile,
  updateProfile,
  updatePassword,
  getInstructorProfile,
  updateInstructorProfile
}; 