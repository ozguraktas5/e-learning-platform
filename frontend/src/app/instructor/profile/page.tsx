'use client';

import { useEffect, useState } from 'react'; //useEffect ve useState için
import { useRouter } from 'next/navigation'; //useRouter için
import { useForm } from 'react-hook-form'; //useForm için
import { z } from 'zod'; //z için
import { zodResolver } from '@hookform/resolvers/zod'; //zodResolver için
import Link from 'next/link'; //Link için
import { toast } from 'react-toastify'; //toast için
import { profileApi } from '@/lib/api/profile'; //profileApi için
import { useAuth } from '@/contexts/AuthContext'; //useAuth için
import LoadingSpinner from '@/components/ui/LoadingSpinner'; //LoadingSpinner için
import { User, Mail, Save, GraduationCap, Book, Globe, Linkedin, Twitter } from 'lucide-react';

const instructorProfileSchema = z.object({ //instructorProfileSchema için
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

type InstructorProfileForm = z.infer<typeof instructorProfileSchema>; //InstructorProfileForm için

export default function InstructorProfilePage() { //InstructorProfilePage için
  const router = useRouter(); //router için
  const { user, loading } = useAuth(); //user ve loading için
  const [loadingData, setLoadingData] = useState(true); //loadingData için
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<InstructorProfileForm>({ //register, handleSubmit, reset, formState: { errors, isDirty } için
    resolver: zodResolver(instructorProfileSchema), //zodResolver için
    defaultValues: { //defaultValues için
      username: '', //username için
      email: '', //email için
      bio: '', //bio için
      expertise: '', //expertise için
      socialMediaLinks: { //socialMediaLinks için
        website: '', //website için
        linkedin: '', //linkedin için
        twitter: '', //twitter için
      }
    },
  });

  useEffect(() => { //useEffect için 
    if (loading) return; //loading için
    
    if (!user) { //user için
      router.push('/login'); //router.push için
      return; //return için
    }
    
    // Eğitmen değilse öğrenci profil sayfasına yönlendir
    if (user.role !== 'instructor') { //user.role !== 'instructor' için
      router.push('/profile'); //router.push için
      return; //return için
    }
    
    profileApi.getInstructorProfile() //profileApi.getInstructorProfile için
      .then((data) => reset({ //reset için
        username: data.username, //username için
        email: data.email, //email için
        bio: data.bio || '', //bio için
        expertise: data.expertise || '', //expertise için
        socialMediaLinks: { //socialMediaLinks için
          website: data.socialMediaLinks?.website || '', //website için
          linkedin: data.socialMediaLinks?.linkedin || '', //linkedin için
          twitter: data.socialMediaLinks?.twitter || '', //twitter için
        }
      }))
      .catch((err) => { //err için
        console.error(err); //console.error için
        toast.error('Profil bilgileri yüklenirken hata oluştu'); //toast.error için
      })
      .finally(() => setLoadingData(false)); //setLoadingData için
  }, [loading, user, reset, router]); //loading, user, reset, router için

  const onSubmit = async (data: InstructorProfileForm) => { //onSubmit için
    try {
      const res = await profileApi.updateInstructorProfile(data); //res için 
      toast.success(res.message || 'Profil başarıyla güncellendi'); //toast.success için
    } catch (error: unknown) { //error için
      const err = error as { response?: { data?: { message?: string } } }; //err için
      const msg = err.response?.data?.message ?? 'Profil güncellenemedi'; //msg için
      toast.error(msg); //toast.error için
    }
  };

  if (loading || loadingData) { //loading ve loadingData için
    return <LoadingSpinner size="medium" fullScreen />; //LoadingSpinner için
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
            <div className="p-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Eğitmen Profilim</h1>
              <p className="text-gray-600">Profesyonel bilgilerinizi görüntüleyin ve düzenleyin</p>
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
              href="/instructor/courses" 
              className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <Book className="h-4 w-4" />
              <span>Kurslarım</span>
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
              <h2 className="text-lg font-medium text-gray-800 mb-4">Profesyonel Bilgiler</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="expertise" className="block text-sm font-medium text-gray-700">Uzmanlık Alanları</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Book className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="expertise"
                      {...register('expertise')}
                      placeholder="örn: Web Geliştirme, React, Python"
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Hakkımda</label>
                  <textarea
                    id="bio"
                    {...register('bio')}
                    rows={4}
                    placeholder="Kendinizi ve deneyimlerinizi kısaca açıklayın..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50/70 p-5 rounded-xl border border-gray-100">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Sosyal Medya Bağlantıları</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700">Web Sitesi</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="website"
                      type="url"
                      {...register('socialMediaLinks.website')}
                      placeholder="https://example.com"
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700">LinkedIn</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Linkedin className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="linkedin"
                      type="url"
                      {...register('socialMediaLinks.linkedin')}
                      placeholder="https://linkedin.com/in/..."
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">Twitter</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Twitter className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="twitter"
                      type="url"
                      {...register('socialMediaLinks.twitter')}
                      placeholder="https://twitter.com/..."
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