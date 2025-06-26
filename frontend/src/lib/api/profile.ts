import axios from './index'; // axios'u import ettik

interface ProfileResponse { // ProfileResponse interface'i oluşturduk
  username: string;
  email: string;
  interests?: string;
  education_level?: string;
}

interface InstructorProfileResponse extends ProfileResponse { // InstructorProfileResponse interface'i oluşturduk
  bio?: string;
  expertise?: string;
  socialMediaLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
  };
}

interface ProfileUpdateBody { // ProfileUpdateBody interface'i oluşturduk
  username: string;
  email: string;
  interests?: string;
  education_level?: string;
}

interface InstructorProfileUpdateBody extends ProfileUpdateBody { // InstructorProfileUpdateBody interface'i oluşturduk
  bio?: string;
  expertise?: string;
  socialMediaLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
  };
}

interface MessageResponse { // MessageResponse interface'i oluşturduk
  message: string;
}

const getProfile = async (): Promise<ProfileResponse> => { // getProfile fonksiyonu oluşturduk
  const { data } = await axios.get('/profile');
  return data;
};

const updateProfile = async (body: ProfileUpdateBody): Promise<MessageResponse> => { // updateProfile fonksiyonu oluşturduk
  const { data } = await axios.put('/profile', body);
  return data;
};

const updatePassword = async (body: { currentPassword: string; newPassword: string }): Promise<MessageResponse> => { // updatePassword fonksiyonu oluşturduk
  const { data } = await axios.put('/profile/password', body);
  return data;
};

const getInstructorProfile = async (): Promise<InstructorProfileResponse> => { // getInstructorProfile fonksiyonu oluşturduk
  const { data } = await axios.get('/instructor/profile');
  return data;
};

const updateInstructorProfile = async (body: InstructorProfileUpdateBody): Promise<MessageResponse> => { // updateInstructorProfile fonksiyonu oluşturduk
  const { data } = await axios.put('/instructor/profile', body);
  return data;
};

export const profileApi = { // profileApi objesi oluşturduk
  getProfile,
  updateProfile,
  updatePassword,
  getInstructorProfile,
  updateInstructorProfile
}; 