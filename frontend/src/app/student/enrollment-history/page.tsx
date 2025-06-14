'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { getImageUrl } from '@/lib/axios';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { History, BookOpen, User, Calendar, Check, Clock, ExternalLink, ArrowRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

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

  // Durum rozeti için renk belirleme fonksiyonu
  const getStatusBadgeStyles = (enrollment: Enrollment) => {
    if (enrollment.completed) {
      return "bg-emerald-50 text-emerald-600 border border-emerald-100";
    } else if (enrollment.progress > 0) {
      return "bg-indigo-50 text-indigo-600 border border-indigo-100";
    } else {
      return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  // İlerleme çubuğu için renk belirleme fonksiyonu
  const getProgressBarColor = (progress: number) => {
    if (progress === 100) {
      return "bg-gradient-to-r from-emerald-400 to-green-500";
    } else if (progress > 50) {
      return "bg-gradient-to-r from-indigo-400 to-purple-500";
    } else if (progress > 0) {
      return "bg-gradient-to-r from-blue-400 to-indigo-500";
    } else {
      return "bg-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-5 rounded-xl shadow-md" role="alert">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              <p className="font-bold text-red-700">Hata</p>
            </div>
            <p className="ml-7">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 ml-7 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-1.5 px-4 rounded-lg text-sm transition-all duration-200 shadow-sm"
            >
              Yeniden Dene
            </button>
          </div>
        )}
        
        <div className="mb-10 relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-200/30 via-purple-100/20 to-pink-200/30 rounded-3xl blur-2xl"></div>
          <div className="p-8 rounded-2xl backdrop-blur-sm bg-white/70 border border-indigo-100/50 shadow-xl">
            <div className="flex items-center space-x-3">
              <History className="h-8 w-8 text-indigo-600" />
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                Kayıt Geçmişi
              </h1>
            </div>
            <p className="text-gray-600 mt-2 ml-11">
              Kayıt olduğunuz tüm kursların listesi ve ilerleme durumlarınız
            </p>
          </div>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl shadow-lg border border-indigo-50">
            <div className="p-6 bg-indigo-50 rounded-full mx-auto w-24 h-24 flex items-center justify-center mb-6">
              <BookOpen className="h-12 w-12 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Henüz hiç kursa kayıt olmadınız</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Kurs araştırmak ve kayıt olmak için kurslar sayfasını ziyaret edin
            </p>
            <Link 
              href="/student/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              Kursları Keşfet
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-indigo-50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 text-left">
                    <th scope="col" className="px-6 py-4 text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                      Kurs
                    </th>
                    <th scope="col" className="px-6 py-4 text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                      Kayıt Tarihi
                    </th>
                    <th scope="col" className="px-6 py-4 text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                      İlerleme
                    </th>
                    <th scope="col" className="px-6 py-4 text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                      Durum
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-indigo-50/40 transition-colors duration-150">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 rounded-lg overflow-hidden">
                            {enrollment.course_image ? (
                              <img 
                                className="h-12 w-12 object-cover" 
                                src={getImageUrl(enrollment.course_image)} 
                                alt={enrollment.course_title} 
                              />
                            ) : (
                              <div className="h-12 w-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                {enrollment.course_title.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-800">{enrollment.course_title}</div>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <User className="h-3 w-3 mr-1 text-gray-400" />
                              {enrollment.instructor_name || 'Eğitmen bilgisi yok'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-indigo-400" />
                          {new Date(enrollment.enrolled_at).toLocaleDateString('tr-TR')}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="w-32">
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                              className={`${getProgressBarColor(enrollment.progress || 0)} h-2 rounded-full`} 
                              style={{ width: `${enrollment.progress || 0}%` }}
                            ></div>
                          </div>
                          <div className="text-xs mt-1.5 font-medium text-gray-600">
                            {enrollment.progress || 0}% tamamlandı
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusBadgeStyles(enrollment)}`}>
                          {enrollment.completed ? (
                            <><Check className="h-3.5 w-3.5 mr-1" />Tamamlandı</>
                          ) : enrollment.progress > 0 ? (
                            <><Clock className="h-3.5 w-3.5 mr-1" />Devam Ediyor</>
                          ) : (
                            <>Başlanmadı</>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        <Link
                          href={`/student/courses/${enrollment.course_id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          Kursa Git
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 