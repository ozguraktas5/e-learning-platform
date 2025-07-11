'use client';

import { useState, useEffect } from 'react';  // React'ten useState ve useEffect'i içe aktarır.
import { useParams, useRouter } from 'next/navigation';  // Next.js'ten useParams ve useRouter'u içe aktarır.
import Link from 'next/link';  // Next.js'ten Link'i içe aktarır.
import { toast } from 'react-hot-toast';  // react-hot-toast'tan toast'u içe aktarır.
import { coursesApi } from '@/lib/api/courses';  // @/lib/api/courses'tan coursesApi'yi içe aktarır.
import { assignmentsApi } from '@/lib/api/assignments';  // @/lib/api/assignments'tan assignmentsApi'yi içe aktarır.
import LoadingSpinner from '@/components/ui/LoadingSpinner';  // @/components/ui/LoadingSpinner'tan LoadingSpinner'u içe aktarır.

interface Assignment {  // Assignment interface'ini oluşturur.
  id: number;  // id değişkenini oluşturur ve number tipinde bir değişken ile başlatır.
  title: string;  // title değişkenini oluşturur ve string tipinde bir değişken ile başlatır.
  description: string;  // description değişkenini oluşturur ve string tipinde bir değişken ile başlatır.
  due_date: string;  // due_date değişkenini oluşturur ve string tipinde bir değişken ile başlatır.
  max_points: number;  // max_points değişkenini oluşturur ve number tipinde bir değişken ile başlatır.
  created_at: string;  // created_at değişkenini oluşturur ve string tipinde bir değişken ile başlatır.
  updated_at: string;  // updated_at değişkenini oluşturur ve string tipinde bir değişken ile başlatır.
  lesson_id: number;  // lesson_id değişkenini oluşturur ve number tipinde bir değişken ile başlatır.
}

export default function CourseAssignmentsPage() {  // CourseAssignmentsPage bileşenini dışa aktarır.
  const { courseId } = useParams();  // useParams fonksiyonunu çağırır ve courseId değişkenini alır.
  const router = useRouter();  // useRouter fonksiyonunu çağırır ve router değişkenini alır.
  const [assignments, setAssignments] = useState<Assignment[]>([]);  // assignments değişkenini oluşturur ve Assignment tipinde bir dizi ile başlatır.
  const [loading, setLoading] = useState(true);  // loading değişkenini oluşturur ve true ile başlatır.
  const [courseTitle, setCourseTitle] = useState('');  // courseTitle değişkenini oluşturur ve '' ile başlatır.

  const numericCourseId = Number(courseId);  // numericCourseId değişkenini oluşturur ve courseId değişkenini Number fonksiyonu ile integer'a çevirir.

  useEffect(() => {  // useEffect fonksiyonunu çağırır.
    if (isNaN(numericCourseId)) {  // numericCourseId değişkeni NaN değilse
      toast.error('Geçersiz Kurs ID');  // toast.error fonksiyonunu çağırır ve 'Geçersiz Kurs ID' ile başlatır.
      router.push('/instructor/courses');  // router.push fonksiyonunu çağırır ve '/instructor/courses' ile yönlendirir.
      return;  // return fonksiyonunu çağırır.
    }

    const fetchAssignmentsAndCourse = async () => {  // fetchAssignmentsAndCourse fonksiyonunu oluşturur.
      setLoading(true);
      try {
        // Kurs detaylarını almak için kurs API'sini kullanır.
        const courseDetails = await coursesApi.getCourse(numericCourseId);
        setCourseTitle(courseDetails.title);
        
        // Kurs ödevlerini almak için ödev API'sini kullanır.
        const courseAssignments = await assignmentsApi.getCourseAssignments(numericCourseId);
        setAssignments(courseAssignments);
      } catch (error) {
        console.error('Failed to fetch assignments or course:', error);  // console.error fonksiyonunu çağırır ve 'Failed to fetch assignments or course:' ile birlikte error'i yazdırır.
        toast.error('Ödevler yüklenirken bir hata oluştu.');  // toast.error fonksiyonunu çağırır ve 'Ödevler yüklenirken bir hata oluştu.' ile başlatır.
      } finally {  // finally bloğunu oluşturur.
        setLoading(false);  // setLoading fonksiyonunu çağırır ve false ile başlatır.
      }
    };  // fetchAssignmentsAndCourse fonksiyonunu oluşturur.

    fetchAssignmentsAndCourse();  // fetchAssignmentsAndCourse fonksiyonunu çağırır.
  }, [numericCourseId, router]);  // useEffect fonksiyonunu çağırır.

  const handleDeleteAssignment = async (assignmentId: number, assignmentTitle: string) => {  // handleDeleteAssignment fonksiyonunu oluşturur ve assignmentId ve assignmentTitle değişkenlerini alır.
    if (!confirm(`"${assignmentTitle}" ödevini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {  // confirm fonksiyonunu çağırır ve '"' ile birlikte assignmentTitle'i ve ' ödevini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.' ile başlatır.
      return;  // return fonksiyonunu çağırır.
    }
    
    try {  // try bloğunu oluşturur.
      await assignmentsApi.deleteAssignment(numericCourseId, assignmentId);  // assignmentsApi'den deleteAssignment fonksiyonunu çağırır ve numericCourseId ve assignmentId değişkenlerini parametre olarak alır.
      toast.success(`"${assignmentTitle}" ödevi başarıyla silindi.`);  // toast.success fonksiyonunu çağırır ve '"' ile birlikte assignmentTitle'i ve ' ödevi başarıyla silindi.' ile başlatır.
      setAssignments(assignments.filter(assignment => assignment.id !== assignmentId));  // setAssignments fonksiyonunu çağırır ve assignments dizisinden assignmentId'ye eşit olmayan öğeleri filtreler.
    } catch (error) {
      console.error('Failed to delete assignment:', error);  // console.error fonksiyonunu çağırır ve 'Failed to delete assignment:' ile birlikte error'i yazdırır.
      toast.error('Ödev silinirken bir hata oluştu.');  // toast.error fonksiyonunu çağırır ve 'Ödev silinirken bir hata oluştu.' ile başlatır.
    }
  };  // handleDeleteAssignment fonksiyonunu oluşturur.

  if (loading) {  // loading değişkeni true ise
    return <LoadingSpinner size="medium" fullScreen />;  // LoadingSpinner bileşenini döndürür.
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{courseTitle}</h1>
            <p className="text-gray-600">
              Toplam {assignments.length} ödev
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
              href={`/instructor/courses/${courseId}/assignments/create`} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Yeni Ödev Ekle
            </Link>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-gray-400 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h5.25a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h5.25a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h5.25a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08" />
            </svg>
            <p className="text-xl text-gray-600 mb-4">Bu kursa henüz ödev eklenmemiş.</p>
            <Link 
              href={`/instructor/courses/${courseId}/assignments/create`}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              İlk Ödevi Ekle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => (
              <div 
                key={assignment.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                    <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                      {assignment.max_points} Puan
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {assignment.description}
                  </p>

                  <div className="flex items-center text-sm text-gray-500 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    Son Teslim: {new Date(assignment.due_date).toLocaleDateString('tr-TR')}
                  </div>
                  
                  <div className="flex items-center justify-end space-x-2">
                    <Link 
                      href={`/instructor/courses/${courseId}/lessons/${assignment.lesson_id}/assignment/${assignment.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center text-sm font-medium"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Detaylar
                    </Link>
                    <button 
                      onClick={() => handleDeleteAssignment(assignment.id, assignment.title)}
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