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
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const changeSchema = z
  .object({
    current_password: z.string().min(1, 'Mevcut şifre giriniz'),
    new_password: z.string().min(6, 'Yeni şifre en az 6 karakter olmalıdır'),
    confirm_password: z.string().min(6, 'Yeni şifreyi tekrar giriniz'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Yeni şifreler eşleşmiyor',
    path: ['confirm_password'],
  });

type ChangeForm = z.infer<typeof changeSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [loadingState, setLoadingState] = useState(true);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ChangeForm>({ resolver: zodResolver(changeSchema) });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
    } else {
      setLoadingState(false);
    }
  }, [loading, user, router]);

  const onSubmit = async (data: ChangeForm) => {
    try {
      await profileApi.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      toast.success('Şifre başarıyla güncellendi');
      router.push('/profile');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message ?? 'Şifre değiştirilemedi';
      toast.error(msg);
    }
  };

  if (loading || loadingState) {
    return <LoadingSpinner size="medium" fullScreen />;
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Şifremi Değiştir</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
            Mevcut Şifre
          </label>
          <input
            id="current_password"
            type="password"
            {...register('current_password')}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.current_password && (
            <p className="text-red-600 text-sm mt-1">{errors.current_password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
            Yeni Şifre
          </label>
          <input
            id="new_password"
            type="password"
            {...register('new_password')}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.new_password && (
            <p className="text-red-600 text-sm mt-1">{errors.new_password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
            Yeni Şifre (Tekrar)
          </label>
          <input
            id="confirm_password"
            type="password"
            {...register('confirm_password')}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.confirm_password && (
            <p className="text-red-600 text-sm mt-1">{errors.confirm_password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Değiştir
        </button>
      </form>
      <div className="mt-4">
        <Link href="/profile" className="text-blue-600 hover:underline">
          Geri Dön
        </Link>
      </div>
    </div>
  );
} 