'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { getImageUrl } from '@/lib/axios';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Enrollment {
  id: string;
  course_id: string;
  course_title: string;
  course_image?: string;
  enrolled_at: string;
  completed?: boolean;
  progress: number;
  price?: number;
  instructor_name?: string;
}

interface CourseResponse {
  id: string;
  enrollment_id: string;
  title: string;
  image_url?: string;
  enrollment_date: string;
  progress: number;
  price?: number;
  instructor_name?: string;
}

export default function EnrollmentHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Kullanıcı olmadığında giriş sayfasına yönlendir
    if (!user) {
      router.push('/login');
      return;
    }

    // Öğrenci olmayan kullanıcıları ana sayfaya yönlendir
    if (user.role !== 'student') {
      router.push('/');
      return;
    }

    const fetchEnrollmentHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
          return;
        }

        // Kayıt geçmişini çekelim - aynı enrolled-courses API'yi kullanabiliriz, frontend'de sıralama yapacağız
        const response = await axios.get(`${API_URL}/api/student/enrolled-courses`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // API verilerini beklediğimiz formata dönüştürelim
        const enrollmentsData = response.data.courses?.map((course: CourseResponse) => ({
          id: course.enrollment_id,
          course_id: course.id,
          course_title: course.title,
          course_image: course.image_url,
          enrolled_at: course.enrollment_date,
          completed: course.progress === 100,
          progress: course.progress,
          price: course.price,
          instructor_name: course.instructor_name
        })) || [];

        // Tarih sırasına göre sırala (en yeni en üstte)
        enrollmentsData.sort((a: Enrollment, b: Enrollment) => 
          new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime()
        );

        setEnrollments(enrollmentsData);
      } catch (err) {
        console.error('Kayıt geçmişi alınamadı:', err);
        setError('Kayıt geçmişi yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollmentHistory();
  }, [user, router]);

  if (loading) {
    return <LoadingSpinner fullScreen size="large" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md" role="alert">
          <p className="font-bold">Hata</p>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm"
          >
            Yeniden Dene
          </button>
        </div>
      )}
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Kayıt Geçmişi</h1>
        <p className="text-gray-600 mt-2">Kayıt olduğunuz tüm kursların listesi ve durumları</p>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Henüz hiç kursa kayıt olmadınız</h2>
          <p className="text-gray-500 mb-6">Kurs araştırmak ve kayıt olmak için kurslar sayfasını ziyaret edin.</p>
          <button 
            onClick={() => router.push('/student/courses')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md"
          >
            Kursları Keşfet
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kurs
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kayıt Tarihi
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İlerleme
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {enrollment.course_image ? (
                            <img 
                              className="h-10 w-10 rounded-md object-cover" 
                              src={getImageUrl(enrollment.course_image)} 
                              alt={enrollment.course_title} 
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center text-blue-500 font-bold">
                              {enrollment.course_title.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{enrollment.course_title}</div>
                          <div className="text-sm text-gray-500">{enrollment.instructor_name || 'Eğitmen bilgisi yok'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(enrollment.enrolled_at).toLocaleDateString('tr-TR')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 w-32">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${enrollment.progress || 0}%` }}
                        ></div>
                      </div>
                      <div className="text-xs mt-1">
                        {enrollment.progress || 0}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {enrollment.completed ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Tamamlandı
                        </span>
                      ) : enrollment.progress > 0 ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Devam Ediyor
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Başlanmadı
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => router.push(`/student/courses/${enrollment.course_id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Kursa Git
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 