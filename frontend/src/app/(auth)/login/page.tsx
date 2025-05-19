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
import Link from 'next/link';
import { Mail, Lock, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
      <div className="relative w-full max-w-md px-6 pt-10 pb-8 bg-white shadow-xl ring-1 ring-gray-900/5 sm:rounded-xl sm:px-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Lock className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <div className="w-full">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Giriş Yap</h1>
            <p className="text-gray-500 mb-8">Hesabınıza giriş yaparak eğitiminize devam edin</p>
          </div>
          
          {redirect && (
            <div className="mb-6 p-4 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>Giriş yaptıktan sonra değerlendirme sayfasına yönlendirileceksiniz.</span>
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-700 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  className="mt-1 block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  id="password"
                  type="password"
                  placeholder="******"
                  className="mt-1 block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 font-medium"
              >
                {isLoading ? <LoadingSpinner size="small" /> : 'Giriş Yap'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Hesabınız yok mu?{' '}
              <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                Kayıt Olun
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}