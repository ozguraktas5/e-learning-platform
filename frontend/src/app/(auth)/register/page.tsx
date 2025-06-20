'use client';

import { useState } from 'react';  // React'ten useState hook'unu içe aktarır.
import { useRouter } from 'next/navigation';  // Next.js'nin navigation API'sini içe aktarır.
import Link from 'next/link';  // Next.js'nin Link bileşenini içe aktarır.
import { useForm } from 'react-hook-form';  // React Hook Form kütüphanesini içe aktarır.
import { zodResolver } from '@hookform/resolvers/zod';  // Zod resolver'ı içe aktarır.
import { z } from 'zod';  // Zod kütüphanesini içe aktarır.
import { authApi } from '@/lib/api/auth';  // authApi kütüphanesini içe aktarır.
import { toast } from 'react-toastify';  // react-toastify kütüphanesini içe aktarır.
import 'react-toastify/dist/ReactToastify.css';  // react-toastify kütüphanesinin CSS'sini içe aktarır.
import { User, Mail, Lock, AlertCircle, UserCheck } from 'lucide-react';  // Lucide React kütüphanesinden User, Mail, Lock, AlertCircle ve UserCheck simgelerini içe aktarır.
import LoadingSpinner from '@/components/ui/LoadingSpinner';  // LoadingSpinner bileşenini içe aktarır.

const registerSchema = z.object({  // Zod kütüphanesi ile registerSchema oluşturulur.
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalıdır'),
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  role: z.enum(['student', 'instructor'], {
    required_error: 'Lütfen bir rol seçiniz',
  }),
});

type RegisterForm = z.infer<typeof registerSchema>;  // RegisterForm tipi registerSchema'dan türetir.

export default function RegisterPage() {  // RegisterPage bileşenini dışa aktarır.
  const router = useRouter();  // useRouter hook'u ile router'ı alır.
  const [error, setError] = useState<string | null>(null);  // error değişkeni oluşturulur ve başlangıç değeri null olarak ayarlanır.
  const [isLoading, setIsLoading] = useState(false);  // isLoading değişkeni oluşturulur ve başlangıç değeri false olarak ayarlanır.

  const {  // useForm hook'u ile register, handleSubmit ve errors değişkenlerini alır.
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),  // zodResolver ile registerSchema'ya bağlanır.
    defaultValues: {
      role: 'student'  // role değişkeni student olarak ayarlanır.
    }
  });

  const onSubmit = async (data: RegisterForm) => {  // onSubmit fonksiyonu ile form verileri alınır.
    try {  // try ile hata yakalanır.
      setError('');  // setError fonksiyonu ile error değişkenine '' atanır.
      setIsLoading(true);  // setIsLoading fonksiyonu ile isLoading değişkenine true atanır.
      
      await authApi.register(data);  // authApi.register ile data gönderilir.
      toast.success('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      setTimeout(() => {  // setTimeout ile 2 saniye sonra router.push ile login sayfasına yönlendirilir.
        router.push('/login?registered=true');  // router.push ile login sayfasına yönlendirilir.
      }, 2000);  // 2000ms sonra setTimeout fonksiyonu çalışır.
      
    } catch (err: unknown) {  // catch ile hata yakalanır.
      const error = err as { response?: { data?: { message?: string } } };  // error değişkeni err'ın response ve data değerlerini alır.
      const errorMessage = error?.response?.data?.message || 'Kayıt başarısız. Lütfen tekrar deneyiniz.';  // errorMessage değişkeni error'ın response ve data değerlerini alır.
      setError(errorMessage);  // setError fonksiyonu ile errorMessage değişkeni atanır.
      toast.error(errorMessage, {  // toast.error ile errorMessage gösterilir.
        position: "top-right",  // position: "top-right" ile toast mesajı sağ üst köşeye gösterilir.
        autoClose: 5000,  // autoClose: 5000 ile toast mesajı 5 saniye sonra kapatılır.
      });
    } finally {  // finally ile setIsLoading fonksiyonu ile isLoading değişkenine false atanır.
      setIsLoading(false);  // setIsLoading fonksiyonu ile isLoading değişkenine false atanır.
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
      <div className="relative w-full max-w-md px-6 pt-10 pb-8 bg-white shadow-xl ring-1 ring-gray-900/5 sm:rounded-xl sm:px-10 my-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <UserCheck className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <div className="w-full">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Hesap Oluştur</h1>
            <p className="text-gray-500 mb-8">Hemen kaydolun ve eğitim yolculuğunuza başlayın</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-700 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('username')}
                  id="username"
                  type="text"
                  placeholder="kullaniciadi"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="radio"
                    id="role-student"
                    {...register('role')}
                    value="student"
                    className="peer absolute opacity-0 w-0 h-0"
                  />
                  <label
                    htmlFor="role-student"
                    className="flex items-center justify-center py-2.5 px-4 w-full border-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200
                    peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:text-indigo-700
                    border-gray-200 bg-gray-50 text-gray-700 hover:bg-white"
                  >
                    <div className="flex items-center">
                      
                      Öğrenci
                    </div>
                  </label>
                </div>
                
                <div className="relative">
                  <input
                    type="radio"
                    id="role-instructor"
                    {...register('role')}
                    value="instructor"
                    className="peer absolute opacity-0 w-0 h-0"
                  />
                  <label
                    htmlFor="role-instructor"
                    className="flex items-center justify-center py-2.5 px-4 w-full border-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200
                    peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:text-indigo-700
                    border-gray-200 bg-gray-50 text-gray-700 hover:bg-white"
                  >
                    <div className="flex items-center">
                      Eğitmen
                    </div>
                  </label>
                </div>
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 font-medium"
              >
                {isLoading ? <LoadingSpinner size="small" /> : 'Kayıt Ol'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Zaten hesabınız var mı?{' '}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                Giriş Yapın
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 