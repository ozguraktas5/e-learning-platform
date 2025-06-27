'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { profileApi } from '@/lib/api/profile';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { User, Book, GraduationCap, Calendar, Mail, Save } from 'lucide-react';

const studentProfileSchema = z.object({
  username: z.string().min(1, 'Kullanıcı adı boş olamaz'),
  email: z.string().email('Geçerli e-posta giriniz'),
  interests: z.string().optional(),
  educationLevel: z.string().optional(),
});

type StudentProfileForm = z.infer<typeof studentProfileSchema>;

export default function StudentProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<StudentProfileForm>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      username: '',
      email: '',
      interests: '',
      educationLevel: '',
    },
  });

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Öğrenci değilse genel profil sayfasına yönlendir
    if (user.role !== 'student') {
      router.push('/profile');
      return;
    }

    // Profil bilgilerini yükle
    profileApi.getProfile()
      .then((data) => {
        reset({
          username: data.username,
          email: data.email,
          interests: data.interests || '',
          educationLevel: data.education_level || '',
        });
      })
      .catch((err) => {
        console.error(err);
        toast.error('Profil bilgileri yüklenirken hata oluştu');
      })
      .finally(() => setLoadingData(false));
  }, [loading, user, reset, router]);

  const onSubmit = async (data: StudentProfileForm) => {
    try {
      // Tüm profil bilgilerini güncelle
      await profileApi.updateProfile({
        username: data.username,
        email: data.email,
        interests: data.interests,
        education_level: data.educationLevel,
      });
      
      toast.success('Profil başarıyla güncellendi');
    } catch (error: unknown) {
      console.error('Profile update error:', error);
      toast.error('Profil güncellenirken bir hata oluştu');
    }
  };

  if (loading || loadingData) {
    return <LoadingSpinner size="medium" fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
            <div className="p-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Öğrenci Profilim</h1>
              <p className="text-gray-600">Kişisel bilgilerinizi görüntüleyin ve düzenleyin</p>
            </div>
          </div>
          
          <div className="mb-6 flex flex-wrap gap-3">
            <Link 
              href="/profile/password" 
              className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <span>Şifremi Değiştir</span>
            </Link>
            <Link 
              href="/student/my-courses" 
              className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <Book className="h-4 w-4" />
              <span>Kurslarım</span>
            </Link>
            <Link 
              href="/student/enrollment-history" 
              className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <Calendar className="h-4 w-4" />
              <span>Kayıt Geçmişi</span>
            </Link>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-gray-50/70 p-5 rounded-xl border border-gray-100">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Temel Bilgiler</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">Kullanıcı Adı</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="username"
                      {...register('username')}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  {errors.username && <p className="text-red-600 text-sm mt-1">{errors.username.message}</p>}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-posta</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      {...register('email')}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50/70 p-5 rounded-xl border border-gray-100">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Eğitim Bilgileri</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="educationLevel" className="block text-sm font-medium text-gray-700">Eğitim Seviyesi</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <GraduationCap className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      id="educationLevel"
                      {...register('educationLevel')}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Seçiniz</option>
                      <option value="high_school">Lise</option>
                      <option value="associate">Önlisans</option>
                      <option value="bachelor">Lisans</option>
                      <option value="master">Yüksek Lisans</option>
                      <option value="doctorate">Doktora</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="interests" className="block text-sm font-medium text-gray-700">İlgi Alanları</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Book className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="interests"
                      {...register('interests')}
                      placeholder="örn: Programlama, Tasarım, Pazarlama"
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={!isDirty}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-lg transition-all duration-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5" />
                <span>Profili Güncelle</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 