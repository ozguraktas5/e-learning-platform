'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { AxiosError } from 'axios';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [redirect, setRedirect] = useState<string | null>(null);
  
  useEffect(() => {
    // LocalStorage'dan yönlendirme bilgisini al
    if (typeof window !== 'undefined') {
      const redirectPath = localStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        setRedirect(redirectPath);
      }
      
      // URL'den token hatası parametresini kontrol et
      const tokenExpired = searchParams.get('tokenExpired');
      if (tokenExpired === 'true') {
        setError('Oturum süreniz dolmuştur. Lütfen tekrar giriş yapın.');
      }
    }
  }, [searchParams]);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      console.log('Login response:', response.data);
      
      if (!response.data.access_token) {
        throw new Error('Token bulunamadı');
      }
      
      // Access token ve refresh token'ı sakla
      localStorage.setItem('refreshToken', response.data.refresh_token);
      await login(response.data.access_token);
      
      // Kullanıcının rolünü kontrol et
      const userRole = response.data.user.role;
      
      // Yönlendirme kontrolü
      if (redirect) {
        localStorage.removeItem('redirectAfterLogin'); // Temizle
        router.push(redirect);
      } else if (userRole === 'instructor') {
        // Eğitmen ise dashboard'a yönlendir
        router.push('/instructor/dashboard');
      } else if (userRole === 'student') {
        // Öğrenci ise dashboard'a yönlendir
        router.push('/student/dashboard');
      } else {
        // Diğer roller için ana sayfaya yönlendir
        router.push('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || err.message);
      } else {
        setError('Giriş yapılırken bir hata oluştu');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Giriş Yap</h2>
        
        {redirect && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
            Giriş yaptıktan sonra değerlendirme sayfasına yönlendirileceksiniz.
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Şifre
            </label>
            <input
              {...register('password')}
              type="password"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? <LoadingSpinner size="small" /> : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}