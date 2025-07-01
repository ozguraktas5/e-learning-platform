'use client';

import { useEffect, useState } from 'react';  // Client-side rendering için directive
import { useParams, useRouter } from 'next/navigation';  // Route parametrelerini almak için
import { toast } from 'react-hot-toast';  // Toast için
import { coursesApi, Lesson } from '@/lib/api/courses';  // Courses API'sini içe aktar
import { lessonApi } from '@/lib/api/lessons';  // Lesson API'sini içe aktar
import Link from 'next/link';  // Link için
import no_video from '/no_video.png';  // No video için
import Image from 'next/image';  // Image için
import { getFullUrl } from '@/lib/utils';  // getFullUrl fonksiyonunu içe aktar
import LoadingSpinner from '@/components/ui/LoadingSpinner';  // LoadingSpinner componentini içe aktar

export default function CourseLessonsPage() {  // CourseLessonsPage componenti
  const { courseId } = useParams();  // Route parametrelerini al
  const router = useRouter();  // Router için
  const [lessons, setLessons] = useState<Lesson[]>([]);  // Lessons state'ini kontrol et
  const [loading, setLoading] = useState(true);  // Loading durumunu kontrol et
  const [courseTitle, setCourseTitle] = useState(''); // Course title state'ini kontrol et

  const numericCourseId = Number(courseId);  // Course ID'yi sayıya çevir

  useEffect(() => {
    if (isNaN(numericCourseId)) {  // Course ID'yi sayıya çevir
      toast.error('Invalid Course ID'); 
      router.push('/courses'); // Kurslar sayfasına yönlendir
      return; // Fonksiyonu sonlandır
    }

    const fetchLessonsAndCourse = async () => {  // fetchLessonsAndCourse fonksiyonu
      setLoading(true);  // Loading durumunu true yap
      try {  // Try bloğu
        // Fetch course details to get the title (optional)
        const courseDetails = await coursesApi.getCourse(numericCourseId);  // Courses API'sini kullanarak course detaylarını al
        setCourseTitle(courseDetails.title);  // Course title'ı set et
        const courseLessons = await coursesApi.getCourseLessons(numericCourseId);  // Courses API'sini kullanarak course'a ait dersleri al
        setLessons(courseLessons);  // Lessons state'ini set et

      } catch (error) {  // Hata durumunda
        console.error('Failed to fetch lessons or course:', error);  // Hata mesajını konsola yazdır
        toast.error('Failed to load lessons.');  // Hata mesajını göster
        // Optionally redirect or show an error message
      } finally {  // Finally bloğu
        setLoading(false);  // Loading durumunu false yap
      }
    };  // fetchLessonsAndCourse fonksiyonunu çağır

    fetchLessonsAndCourse();  // fetchLessonsAndCourse fonksiyonunu çağır
  }, [numericCourseId, router]);  // numericCourseId, router değiştiğinde çalışır

  // Ders düzenleme işlemi
  const handleEditLesson = (lessonId: number) => {
    router.push(`/courses/${courseId}/lessons/${lessonId}/edit`);  // Ders düzenleme sayfasına yönlendir
  };

  // Ders silme işlemi
  const handleDeleteLesson = async (lessonId: number, lessonTitle: string) => {
    // Kullanıcı onayı istenir
    if (!confirm(`"${lessonTitle}" dersini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      return;  // Kullanıcı onayı istenir
    }
    
    try {  // Try bloğu
      await lessonApi.deleteLesson(numericCourseId, lessonId);  // Lesson API'sini kullanarak dersi sil
      toast.success(`"${lessonTitle}" dersi başarıyla silindi.`);  // Başarı mesajını göster
      
      // Silinen dersi state'den kaldır
      setLessons(lessons.filter(lesson => lesson.id !== lessonId));
    } catch (error) {  // Hata durumunda
      console.error('Failed to delete lesson:', error);  // Hata mesajını konsola yazdır
      toast.error('Ders silinirken bir hata oluştu.');  // Hata mesajını göster
    }
  };

  if (loading) {  // Loading durumunda
    return <LoadingSpinner size="medium" fullScreen />;  // LoadingSpinner componentini göster
  }

  return (  // CourseLessonsPage componenti
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {courseTitle}
            </h1>
            <p className="text-gray-600">
              Toplam {lessons.length} ders
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href={`/instructor/courses/${courseId}`}
              className="text-gray-600 hover:text-gray-800 flex items-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
              Kurs Detayları
            </Link>
            <Link 
              href={`/instructor/courses/${courseId}/lessons/create`} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Yeni Ders Ekle
            </Link>
          </div>
        </div>

        {lessons.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-gray-400 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <p className="text-xl text-gray-600 mb-4">Bu kursa henüz ders eklenmemiş.</p>
            <Link 
              href={`/instructor/courses/${courseId}/lessons/create`}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              İlk Dersi Ekle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => (
              <div 
                key={lesson.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <div className="aspect-video bg-gray-100 relative">
                  {lesson.video_url ? (
                    <video 
                      src={getFullUrl(lesson.video_url)} 
                      controls 
                      muted
                      playsInline
                      preload="metadata"
                      className="object-cover w-full h-full"
                      title={lesson.title}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image 
                        src={no_video}
                        alt="No video available"
                        className="w-1/3 h-1/3 object-contain opacity-50" 
                      />
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{lesson.title}</h3>
                    <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                      Ders {lesson.order}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                    {lesson.content?.length > 150 
                      ? `${lesson.content.substring(0, 150)}...` 
                      : lesson.content || 'Bu ders için içerik bulunmamaktadır.'}
                  </p>
                  
                  <div className="flex items-center justify-end space-x-2">
                    <Link 
                      href={`/instructor/courses/${courseId}/lessons/${lesson.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center text-sm font-medium"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Detaylar
                    </Link>
                    <button 
                      onClick={() => handleEditLesson(lesson.id)}
                      className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors flex items-center text-sm font-medium border border-gray-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      Düzenle
                    </button>
                    <button 
                      onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                      className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors flex items-center text-sm font-medium"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Placeholder for Lesson type if not defined in coursesApi
// interface Lesson {
//   id: number;
//   title: string;
//   // Add other relevant lesson properties
// } 