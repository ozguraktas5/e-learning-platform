'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { coursesApi, Course } from '@/lib/api/courses';
import { instructorsApi } from '@/lib/api/instructors';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import api from '@/lib/axios';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  totalReviews: number;
  averageRating: number;
  totalCompletionRate: number;
  recentEnrollments: number;
}

interface CourseBasicInfo extends Course {
  student_count: number;
  reviews_count?: number;
  average_rating?: number;
  completion_rate?: number;
}

export default function InstructorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [courses, setCourses] = useState<CourseBasicInfo[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // Eğitmen kurslarını al
        const coursesResponse = await coursesApi.getAllCourses();
        
        // Öğrenci istatistiklerini al
        const studentStats = await instructorsApi.getStudentStats();
        
        // Kurs değerlendirmelerini ve bilgilerini al
        const coursesWithDetails = await Promise.all(
          coursesResponse.map(async (course) => {
            try {
              // Kurs değerlendirmelerini al - backend API'yi doğrudan kullan
              const reviewsResponse = await api.get(`/courses/${course.id}/reviews`);
              const reviewsData = reviewsResponse.data;
              
              return {
                ...course,
                student_count: 0, // Öğrenci sayısı istatistiklerden alınacak
                reviews_count: reviewsData.total_reviews || 0,
                average_rating: reviewsData.average_rating || 0,
                completion_rate: 0 // Tamamlanma oranı istatistiklerden alınacak
              };
            } catch (error) {
              console.error(`Error fetching details for course ${course.id}:`, error);
              return {
                ...course,
                student_count: 0,
                reviews_count: 0,
                average_rating: 0,
                completion_rate: 0
              };
            }
          })
        );
        
        setCourses(coursesWithDetails);
        
        // İstatistikleri hesapla
        if (coursesWithDetails.length > 0 && studentStats) {
          // Değerlendirmelerin toplamını hesapla
          const totalReviews = coursesWithDetails.reduce((sum, course) => sum + (course.reviews_count || 0), 0);
          
          // Kursların ortalama puanını hesapla
          const totalRating = coursesWithDetails.reduce((sum, course) => sum + (course.average_rating || 0), 0);
          const averageRating = totalRating / coursesWithDetails.length || 0;
          
          setStats({
            totalCourses: coursesWithDetails.length,
            totalStudents: studentStats.total_students,
            totalReviews,
            averageRating,
            totalCompletionRate: studentStats.average_course_completion,
            recentEnrollments: studentStats.completions_this_month
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Dashboard bilgileri yüklenirken bir hata oluştu');
        toast.error('Dashboard bilgileri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  if (loading) {
    return <LoadingSpinner fullScreen size="large" />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          <h3 className="font-medium text-xl">Hata</h3>
          <p className="mt-2">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* İstatistik Kartları */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm uppercase">Toplam Kurslar</h3>
            <p className="text-3xl font-bold">{stats.totalCourses}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm uppercase">Toplam Öğrenciler</h3>
            <p className="text-3xl font-bold">{stats.totalStudents}</p>
            <p className="text-sm text-green-600 mt-1">+{stats.recentEnrollments} son 30 günde</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <h3 className="text-gray-500 text-sm uppercase">Ortalama Değerlendirme</h3>
            <div className="flex items-center">
              <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
              <div className="text-yellow-500 ml-2 text-xl">★</div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Toplam {stats.totalReviews} değerlendirme</p>
          </div>
        </div>
      )}
      
      {/* Hızlı Erişim Menüsü */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/instructor/courses" className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 p-4 rounded-lg transition-colors flex items-center">
          <div className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <span className="font-medium">Kurslarım</span>
        </Link>
        
        <Link href="/instructor/students" className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 p-4 rounded-lg transition-colors flex items-center">
          <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <span className="font-medium">Öğrencilerim</span>
        </Link>
        
        <Link href="/instructor/assignments" className="bg-amber-50 hover:bg-amber-100 border border-amber-200 p-4 rounded-lg transition-colors flex items-center">
          <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <span className="font-medium">Ödevler</span>
        </Link>
      </div>
      
      {/* Kurslar Tablosu */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Kurslarım</h2>
          <Link href="/instructor/courses" className="text-blue-600 hover:underline text-sm">
            Tümünü Görüntüle
          </Link>
        </div>
        
        {courses.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Henüz hiç kursunuz yok. Yeni bir kurs oluşturmak için &quot;Yeni Kurs Oluştur&quot; butonunu kullanabilirsiniz.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-gray-700 text-sm">
                <tr>
                  <th className="text-left py-3 px-4">Kurs Adı</th>
                  <th className="text-center py-3 px-4">Öğrenci Sayısı</th>
                  <th className="text-center py-3 px-4">Değerlendirme</th>
                  <th className="text-center py-3 px-4">Tamamlanma</th>
                  <th className="text-center py-3 px-4">Oluşturma Tarihi</th>
                  <th className="text-right py-3 px-4">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {courses.slice(0, 5).map(course => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link href={`/instructor/courses/${course.id}`} className="font-medium text-blue-600 hover:underline">
                        {course.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-center">{course.student_count}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <span>{course.average_rating?.toFixed(1) || 'N/A'}</span>
                        {course.average_rating && course.average_rating > 0 && <span className="text-yellow-500 ml-1">★</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${course.completion_rate || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {Math.round(course.completion_rate || 0)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-500">
                      {formatDate(course.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link 
                        href={`/instructor/courses/${course.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 inline-block mr-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </Link>
                      <Link 
                        href={`/instructor/courses/${course.id}`}
                        className="text-gray-600 hover:text-gray-800 inline-block"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 