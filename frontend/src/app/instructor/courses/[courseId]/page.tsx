'use client';

import { useEffect, useState } from 'react';  // Client-side rendering için directive
import { useParams, useRouter } from 'next/navigation';  // Route parametrelerini almak için
import { toast } from 'react-hot-toast';  // Toast için
import { coursesApi, Course } from '@/lib/api/courses';  // Courses API'sini içe aktar
import { useAuth } from '@/hooks/useAuth';  // useAuth hook'u içe aktar
import Link from 'next/link';  // Link için
import LoadingSpinner from '@/components/ui/LoadingSpinner';  // LoadingSpinner componentini içe aktar
import Image from 'next/image';  // Image için
import { API_URL } from '@/config';  // API_URL için
import { translateLevelToTurkish } from '@/lib/utils/courseUtils';  // translateLevelToTurkish fonksiyonunu içe aktar

export default function CourseDetail() {  // CourseDetail componenti
  const { courseId } = useParams();  // Route parametrelerini al
  const router = useRouter();  // Router için
  const { user } = useAuth();  // useAuth hook'u içe aktar
  const [course, setCourse] = useState<Course | null>(null);  // Course state'ini kontrol et
  const [loading, setLoading] = useState(true);  // Loading durumunu kontrol et
  const [enrolling, setEnrolling] = useState(false);  // Enrolling state'ini kontrol et

  useEffect(() => {  // useEffect hook'u ile component mount edildiğinde veya dependency değiştiğinde çalışır
    const fetchCourse = async () => {  // fetchCourse fonksiyonu
      try {  // Try bloğu
        const response = await coursesApi.getCourse(Number(courseId));  // Courses API'sini kullanarak course detaylarını al
        setCourse(response);  // Course state'ini set et
      } catch (error) {  // Hata durumunda
        toast.error('Failed to load course details');  // Hata mesajını göster
        console.error('Error fetching course:', error);  // Hata mesajını konsola yazdır
      } finally {  // Finally bloğu
        setLoading(false);  // Loading durumunu false yap
      }
    };  // fetchCourse fonksiyonunu çağır

    fetchCourse();  // fetchCourse fonksiyonunu çağır
  }, [courseId]);  // courseId değiştiğinde çalışır

  const handleEnroll = async () => {  // handleEnroll fonksiyonu
    if (!user) {  // Kullanıcı yoksa
      toast.error('Please login to enroll in courses');  // Hata mesajını göster
      return;  // Fonksiyonu sonlandır
    }

    setEnrolling(true);  // Enrolling state'ini true yap
    try {  // Try bloğu
      await coursesApi.enrollInCourse(Number(courseId));  // Courses API'sini kullanarak kursa kayıt ol
      toast.success('Successfully enrolled in course!');  // Başarı mesajını göster
    } catch (error) {  // Hata durumunda
      toast.error('Failed to enroll in course');  // Hata mesajını göster
      console.error('Error enrolling in course:', error);  // Hata mesajını konsola yazdır
    } finally {  // Finally bloğu
      setEnrolling(false);  // Enrolling state'ini false yap
    }
  };  // handleEnroll fonksiyonunu çağır

  if (loading) {  // Loading durumunda
    return <LoadingSpinner size="medium" fullScreen />;  // LoadingSpinner componentini göster
  }

  if (!course) {  // Course yoksa
    return <div>Kurs bulunamadı</div>;  // Hata mesajını göster
  }

  return (  // CourseDetail componenti
    <div className="container mx-auto max-w-7xl p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{course.title}</h1>
        {user?.role === 'instructor' && (  // Kullanıcı rolü instructor ise
          <div className="flex space-x-2">
            <Link
              href={`/instructor/courses/${course.id}/edit`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Düzenle
            </Link>
            <button
              onClick={async () => {  // onClick fonksiyonu
                if (!confirm('Bu kursu silmek istediğinize emin misiniz?')) return;  // Kullanıcı onay vermezse fonksiyonu sonlandır
                try {  // Try bloğu
                  await coursesApi.deleteCourse(course.id.toString());  // Courses API'sini kullanarak kursu sil
                  toast.success('Kurs başarıyla silindi');  // Başarı mesajını göster
                  router.push('/instructor/courses');  // Kurslar sayfasına yönlendir
                } catch (err) {  // Hata durumunda
                  toast.error('Kurs silme işlemi başarısız');  // Hata mesajını göster
                  console.error(err);  // Hata mesajını konsola yazdır
                }
              }}  // onClick fonksiyonunu çağır
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Sil
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon - Kurs Detayları */}
        <div className="lg:col-span-2">
          {/* Kurs Resmi */}
          {course.image_url && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="relative w-full h-[400px]">
                <Image
                  src={`${API_URL}${course.image_url}`}
                  alt={course.title}
                  fill
                  className="object-cover rounded-lg"
                  priority
                />
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Kurs Açıklaması</h2>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: course.description }} />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Kurs İçeriği</h2>
            <div className="space-y-4">
              <Link 
                href={`/instructor/courses/${course.id}/lessons`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3 text-blue-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  <span className="font-medium">Dersler</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>

              <Link 
                href={`/instructor/courses/${course.id}/assignments`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3 text-green-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                  <span className="font-medium">Ödevler</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>

              <Link 
                href={`/instructor/courses/${course.id}/reviews`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3 text-yellow-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                  <span className="font-medium">Değerlendirmeler</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Sağ Kolon - Kurs Bilgileri */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Kurs Bilgileri</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Kategori</span>
                <span className="font-medium">{course.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Seviye</span>
                <span className="font-medium">{translateLevelToTurkish(course.level)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Fiyat</span>
                <span className="font-medium">{course.price} TL</span>
              </div>
              
              {user?.role !== 'instructor' && (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
                >
                  {enrolling ? 'Kayıt Olunuyor...' : 'Şimdi Kayıt Ol'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}