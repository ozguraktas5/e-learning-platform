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

const profileSchema = z.object({
  username: z.string().min(1, 'Kullanıcı adı boş olamaz'),
  email: z.string().email('Geçerli e-posta giriniz'),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: '', email: '' },
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    profileApi.getProfile()
      .then((data) => reset({ username: data.username, email: data.email }))
      .catch((err) => {
        console.error(err);
        toast.error('Profil bilgileri yüklenirken hata oluştu');
      })
      .finally(() => setLoadingData(false));
  }, [loading, user, reset, router]);

  const onSubmit = async (data: ProfileForm) => {
    try {
      const res = await profileApi.updateProfile(data);
      toast.success(res.message || 'Profil başarıyla güncellendi');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message ?? 'Profil güncellenemedi';
      toast.error(msg);
    }
  };

  if (loading || loadingData) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Profilim</h1>
      <div className="mb-6">
        <Link href="/profile/password" className="text-blue-600 hover:underline">
          Şifremi Değiştir
        </Link>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        <button
          type="submit"
          disabled={!isDirty}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Güncelle
        </button>
      </form>
    </div>
  );
} 