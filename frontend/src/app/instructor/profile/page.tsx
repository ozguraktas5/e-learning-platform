'use client';

import { useEffect, useState } from 'react'; //useEffect ve useState için
import { useRouter } from 'next/navigation'; //useRouter için
import { useForm } from 'react-hook-form'; //useForm için
import { z } from 'zod'; //z için
import { zodResolver } from '@hookform/resolvers/zod'; //zodResolver için
import Link from 'next/link'; //Link için
import { toast } from 'react-toastify'; //toast için
import { profileApi } from '@/lib/api/profile'; //profileApi için
import { useAuth } from '@/hooks/useAuth'; //useAuth için
import LoadingSpinner from '@/components/ui/LoadingSpinner'; //LoadingSpinner için

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
    <div className="max-w-7xl mx-auto p-4"> 
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