'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { profileApi } from '@/lib/api/profile';
import { useAuth } from '@/hooks/useAuth';

const instructorProfileSchema = z.object({
  username: z.string().min(1, 'Kullanıcı adı boş olamaz'),
  email: z.string().email('Geçerli e-posta giriniz'),
  bio: z.string().optional(),
  expertise: z.string().optional(),
  socialMediaLinks: z.object({
    website: z.string().optional(),
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
  }).optional(),
});

type InstructorProfileForm = z.infer<typeof instructorProfileSchema>;

export default function InstructorProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<InstructorProfileForm>({
    resolver: zodResolver(instructorProfileSchema),
    defaultValues: {
      username: '',
      email: '',
      bio: '',
      expertise: '',
      socialMediaLinks: {
        website: '',
        linkedin: '',
        twitter: '',
      }
    },
  });

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Eğitmen değilse öğrenci profil sayfasına yönlendir
    if (user.role !== 'instructor') {
      router.push('/profile');
      return;
    }
    
    profileApi.getInstructorProfile()
      .then((data) => reset({
        username: data.username,
        email: data.email,
        bio: data.bio || '',
        expertise: data.expertise || '',
        socialMediaLinks: {
          website: data.socialMediaLinks?.website || '',
          linkedin: data.socialMediaLinks?.linkedin || '',
          twitter: data.socialMediaLinks?.twitter || '',
        }
      }))
      .catch((err) => {
        console.error(err);
        toast.error('Profil bilgileri yüklenirken hata oluştu');
      })
      .finally(() => setLoadingData(false));
  }, [loading, user, reset, router]);

  const onSubmit = async (data: InstructorProfileForm) => {
    try {
      const res = await profileApi.updateInstructorProfile(data);
      toast.success(res.message || 'Profil başarıyla güncellendi');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message ?? 'Profil güncellenemedi';
      toast.error(msg);
    }
  };

  if (loading || loadingData) {
    return <div className="p-4">Yükleniyor...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Eğitmen Profilim</h1>
      
      <div className="mb-6 flex space-x-4">
        <Link href="/profile/password" className="text-blue-600 hover:underline">
          Şifremi Değiştir
        </Link>
        <Link href="/instructor/courses" className="text-blue-600 hover:underline">
          Kurslarım
        </Link>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Kullanıcı Adı</label>
            <input
              id="username"
              {...register('username')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.username && <p className="text-red-600 text-sm mt-1">{errors.username.message}</p>}
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-posta</label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
          </div>
        </div>
        
        <div>
          <label htmlFor="expertise" className="block text-sm font-medium text-gray-700">Uzmanlık Alanları</label>
          <input
            id="expertise"
            {...register('expertise')}
            placeholder="Örn: Web Geliştirme, React, Python"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Hakkımda</label>
          <textarea
            id="bio"
            {...register('bio')}
            rows={4}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Sosyal Medya Bağlantıları</h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">Web Sitesi</label>
              <input
                id="website"
                type="url"
                {...register('socialMediaLinks.website')}
                placeholder="https://"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700">LinkedIn</label>
              <input
                id="linkedin"
                type="url"
                {...register('socialMediaLinks.linkedin')}
                placeholder="https://linkedin.com/in/..."
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">Twitter</label>
              <input
                id="twitter"
                type="url"
                {...register('socialMediaLinks.twitter')}
                placeholder="https://twitter.com/..."
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={!isDirty}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Profili Güncelle
        </button>
      </form>
    </div>
  );
} 