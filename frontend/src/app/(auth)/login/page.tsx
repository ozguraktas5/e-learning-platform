'use client'; 

import { useState, useEffect } from 'react';  // React'ten useState ve useEffect hook'larını içe aktarır.
import { useForm } from 'react-hook-form';  // React Hook Form kütüphanesini içe aktarır.
import { zodResolver } from '@hookform/resolvers/zod';  // Zod resolver'ı içe aktarır.
import { z } from 'zod';  // Zod kütüphanesini içe aktarır.
import { useAuth } from '@/contexts/AuthContext';  // AuthContext'i içe aktarır.
import { useRouter, useSearchParams } from 'next/navigation';  // Next.js'nin navigation API'sini içe aktarır.
import api from '@/lib/axios';  // Axios kütüphanesini içe aktarır.
import { AxiosError } from 'axios';  // AxiosError kütüphanesini içe aktarır.
import LoadingSpinner from '@/components/ui/LoadingSpinner';  // LoadingSpinner bileşenini içe aktarır.
import Link from 'next/link';  // Next.js'nin Link bileşenini içe aktarır.
import { Mail, Lock, AlertCircle } from 'lucide-react';  // Lucide React kütüphanesinden Mail, Lock ve AlertCircle simgelerini içe aktarır.

const loginSchema = z.object({  // Zod kütüphanesi ile loginSchema oluşturulur.
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

type LoginFormData = z.infer<typeof loginSchema>;  // LoginFormData tipi loginSchema'dan türetir.

export default function LoginPage() {  // LoginPage bileşenini dışa aktarır.
  const { login } = useAuth();  // useAuth hook'u ile login fonksiyonunu alır.
  const router = useRouter();  // useRouter hook'u ile router'ı alır.
  const searchParams = useSearchParams();  // useSearchParams hook'u ile searchParams'ı alır.
  const [error, setError] = useState<string | null>(null);  // error değişkeni oluşturulur ve başlangıç değeri null olarak ayarlanır.
  const [isLoading, setIsLoading] = useState(false);  // isLoading değişkeni oluşturulur ve başlangıç değeri false olarak ayarlanır.
  const [redirect, setRedirect] = useState<string | null>(null);  // redirect değişkeni oluşturulur ve başlangıç değeri null olarak ayarlanır.
  
  useEffect(() => {  // useEffect hook'u ile localStorage'dan yönlendirme bilgisini alır.
    if (typeof window !== 'undefined') {  // window değişkeni undefined değilse
      const redirectPath = localStorage.getItem('redirectAfterLogin');  // localStorage'dan redirectAfterLogin değerini alır.
      if (redirectPath) {  // redirectPath değeri varsa setRedirect fonksiyonu ile redirect değişkenine atanır.
        setRedirect(redirectPath);  // redirect değişkenine redirectPath değeri atanır.
      }
      
      // URL'den token hatası parametresini kontrol et
      const tokenExpired = searchParams.get('tokenExpired');  // searchParams'dan tokenExpired değerini alır.
      if (tokenExpired === 'true') {  // tokenExpired değeri true ise setError fonksiyonu ile error değişkenine atanır.
        setError('Oturum süreniz dolmuştur. Lütfen tekrar giriş yapın.');  // error değişkenine Oturum süreniz dolmuştur. Lütfen tekrar giriş yapın. değeri atanır.
      }
    }
  }, [searchParams]);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({  // useForm hook'u ile register, handleSubmit ve errors değişkenlerini alır.
    resolver: zodResolver(loginSchema),  // zodResolver ile loginSchema'ya bağlanır.
  });

  const onSubmit = async (data: LoginFormData) => {  // onSubmit fonksiyonu ile form verileri alınır.
    setError(null);  // setError fonksiyonu ile error değişkenine null atanır.
    setIsLoading(true);  // setIsLoading fonksiyonu ile isLoading değişkenine true atanır.
    try {
      const response = await api.post('/auth/login', data);  // api.post ile login endpoint'ine data gönderilir.
      
      if (!response.data.access_token) {  // response.data.access_token değeri yoksa throw new Error ile hata fırlatılır.
        throw new Error('Token bulunamadı');  // Token bulunamadı hata fırlatılır.
      }
      
      // Access token ve refresh token'ı sakla
      localStorage.setItem('refreshToken', response.data.refresh_token);  // localStorage'a refreshToken değeri atanır.
      await login(response.data.access_token);  // login fonksiyonu ile access_token gönderilir.
      
      // Kullanıcının rolünü kontrol et
      const userRole = response.data.user.role;  // userRole değişkeni response.data.user.role değerini alır.
      
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
    } catch (err) {  // catch ile hata yakalanır.
      console.error('Login error:', err);  // console.error ile hata yazdırılır.
      if (err instanceof AxiosError) {  // err instanceof AxiosError ise setError fonksiyonu ile hata mesajı atanır.
        setError(err.response?.data?.message || err.message);  // setError fonksiyonu ile hata mesajı atanır.
      } else {
        setError('Giriş yapılırken bir hata oluştu');  // setError fonksiyonu ile Giriş yapılırken bir hata oluştu mesajı atanır.
      }
    } finally {  // finally ile setIsLoading fonksiyonu ile isLoading değişkenine false atanır.
      setIsLoading(false);  // setIsLoading fonksiyonu ile isLoading değişkenine false atanır.
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