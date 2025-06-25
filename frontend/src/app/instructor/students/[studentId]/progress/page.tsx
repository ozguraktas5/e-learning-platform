'use client';

import { useState, useEffect } from 'react'; //useState ve useEffect için
import { useParams } from 'next/navigation'; //useParams için
import { toast } from 'react-hot-toast'; //toast için
import Link from 'next/link'; //Link için
import LoadingSpinner from '@/components/ui/LoadingSpinner'; //LoadingSpinner için
import { instructorsApi, StudentProgress } from '@/lib/api/instructors'; //instructorsApi ve StudentProgress için

export default function StudentProgressPage() { //StudentProgressPage için
  const { studentId } = useParams(); //studentId için
  const [loading, setLoading] = useState(true); //loading için
  const [error, setError] = useState<string | null>(null); //error için
  const [student, setStudent] = useState<StudentProgress | null>(null); //student için

  useEffect(() => { //useEffect için
    async function fetchStudentProgress() { //fetchStudentProgress için
      try {
        setLoading(true); //setLoading için
        setError(null); //setError için
        const data = await instructorsApi.getStudentProgress(Number(studentId)); //data için
        
        // API'den gelen verinin doğruluğunu kontrol et
        if (!data) {
          throw new Error('Öğrenci bilgileri alınamadı');
        }
        
        if (!data.name || !data.email) { //data.name ve data.email için
          throw new Error('Öğrenci bilgileri eksik');
        }
        
        if (!Array.isArray(data.courses) || data.courses.length === 0) { //data.courses için
          throw new Error('Öğrencinin kayıtlı olduğu kurs bulunamadı');
        }
        
        setStudent(data); //setStudent için
      } catch (error: unknown) { //error için
        console.error('Error fetching student progress:', error); //console.error için
        // API'den gelen hata mesajını kullan veya varsayılan mesajı göster
        let errorMessage = 'Öğrenci bilgileri yüklenirken bir hata oluştu'; //errorMessage için
        
        if (error instanceof Error) { //error instanceof Error için
          errorMessage = error.message; //errorMessage için
        } else if (typeof error === 'object' && error !== null && 'response' in error) { //typeof error === 'object' && error !== null && 'response' in error için
          const axiosError = error as { response?: { data?: { error?: string } } }; //axiosError için
          errorMessage = axiosError.response?.data?.error || errorMessage; //errorMessage için
        }
        
        setError(errorMessage); //setError için
        toast.error(errorMessage); //toast.error için
      } finally { //finally için
        setLoading(false); //setLoading için
      }
    }

    if (studentId) { //studentId için
      fetchStudentProgress(); //fetchStudentProgress için
    }
  }, [studentId]); //studentId için

  const formatDate = (dateString: string) => { //formatDate için
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) { //loading için
    return <LoadingSpinner fullScreen size="large" />; //LoadingSpinner için
  }

  if (error || !student || !student.name) { //error veya student veya student.name için
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Öğrenci İlerleme Detayları</h1>
            <Link
              href="/instructor/students"
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
              Öğrencilere Dön
            </Link>
          </div>
          <div className="bg-red-50 p-4 rounded-md text-red-800">
            <h3 className="font-medium text-xl">Hata</h3>
            <p className="mt-2">{error || 'Öğrenci bilgileri bulunamadı.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Öğrenci İlerleme Detayları</h1>
          <Link
            href="/instructor/students"
            className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Öğrencilere Dön
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100">
              {student.avatar ? (
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500 text-2xl font-bold">
                  {student.name?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold">{student.name}</h2>
              <p className="text-gray-600">{student.email}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {(student.courses || []).map(course => (
            <div key={course.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold">{course.title}</h3>
                <div className="flex items-center">
                  <div className="text-sm text-gray-500 mr-4">
                    Son aktivite: {formatDate(course.last_activity)}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    course.progress === 100
                      ? 'bg-green-100 text-green-800'
                      : course.progress >= 50
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {course.progress}% Tamamlandı
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Ders İlerlemesi</h4>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span>Tamamlanan Dersler</span>
                      <span className="font-medium">{course.completed_lessons} / {course.total_lessons}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${(course.completed_lessons / course.total_lessons) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Ödev Durumu</h4>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span>Tamamlanan Ödevler</span>
                      <span className="font-medium">{course.completed_assignments} / {course.total_assignments}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{ width: `${(course.completed_assignments / course.total_assignments) * 100}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Ortalama Not:</span>{' '}
                      <span className={`${
                        course.average_grade >= 85 ? 'text-green-600' :
                        course.average_grade >= 70 ? 'text-blue-600' :
                        'text-amber-600'
                      }`}>
                        {course.average_grade}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 