'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Book, Bell, ExternalLink } from 'lucide-react';
import axios from 'axios';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Cookie yardımcı fonksiyonu
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';').shift() || '');
};

interface EnrolledCourse {
  id: string;
  title: string;
  progress: number;
  image_url?: string;
  last_accessed?: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Öncelikle cookie ve localStorage'da token varlığını kontrol et
    const token = localStorage.getItem('token') || getCookie('token');
    
    if (!token) {
      console.log('No token found, redirecting to login');
      router.push('/login');
      return;
    }

    if (!user) {
      return; // Token var ama user yükleniyor, bekle
    }

    if (user.role !== 'student') {
      console.log('User role is not student:', user.role);
      router.push('/');
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Token'ı hem localStorage hem cookie'den al
        const authToken = localStorage.getItem('token') || getCookie('token');
        if (!authToken) {
          setError('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
          return;
        }

        // Paralel olarak verileri çekelim
        const [coursesResponse, notificationsResponse] = await Promise.all([
          axios.get(`${API_URL}/api/student/enrolled-courses`, {
            headers: { Authorization: `Bearer ${authToken}` }
          }),
          axios.get(`${API_URL}/api/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${authToken}` }
          })
        ]);

        setEnrolledCourses(coursesResponse.data.courses || []);
        setUnreadCount(notificationsResponse.data.count || 0);
      } catch (error) {
        console.error('Dashboard verileri alınamadı:', error);
        setError('Dashboard verileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'student') {
      fetchDashboardData();
    }
  }, [user, router]);

  if (!user || loading) {
    return <LoadingSpinner fullScreen size="large" />;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {error && (
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
      )}

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm uppercase">Kayıtlı Kurslar</h3>
          <p className="text-3xl font-bold">{enrolledCourses.length}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm uppercase">Ortalama İlerleme</h3>
          <p className="text-3xl font-bold">
            {enrolledCourses.length 
              ? Math.round(enrolledCourses.reduce((sum, course) => sum + course.progress, 0) / enrolledCourses.length) 
              : 0}%
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <h3 className="text-gray-500 text-sm uppercase">Tamamlanan Kurslar</h3>
          <p className="text-3xl font-bold">
            {enrolledCourses.filter(course => course.progress === 100).length}
          </p>
        </div>
      </div>

      {/* Hızlı Erişim Menüsü */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link href="/student/my-courses" className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 p-4 rounded-lg transition-colors flex items-center">
          <div className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center mr-3">
            <Book className="w-6 h-6" />
          </div>
          <span className="font-medium">Kayıtlı Kurslarım</span>
        </Link>

        <Link href="/student/courses" className="bg-purple-50 hover:bg-purple-100 border border-purple-200 p-4 rounded-lg transition-colors flex items-center">
          <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center mr-3">
            <Book className="w-6 h-6" />
          </div>
          <span className="font-medium">Kurslar</span>
        </Link>

        <Link href="/student/notifications" className="bg-amber-50 hover:bg-amber-100 border border-amber-200 p-4 rounded-lg transition-colors flex items-center">
          <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center mr-3">
            <Bell className="w-6 h-6" />
          </div>
          <span className="font-medium">Bildirimler</span>
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">{unreadCount}</span>
          )}
        </Link>
      </div>

      {/* Kayıtlı Kurslar Tablosu */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Kayıtlı Kurslarım</h2>
          <Link href="/student/my-courses" className="text-blue-600 hover:underline text-sm">
            Tümünü Görüntüle
          </Link>
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Henüz hiç kursa kayıt olmadınız. Yeni kurslara göz atmak için &quot;Kurslar&quot; bölümünü ziyaret edebilirsiniz.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-gray-700 text-sm">
                <tr>
                  <th className="text-left py-3 px-4">Kurs Adı</th>
                  <th className="text-center py-3 px-4">İlerleme</th>
                  <th className="text-center py-3 px-4">Son Erişim</th>
                  <th className="text-right py-3 px-4">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {enrolledCourses.slice(0, 5).map(course => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link href={`/student/courses/${course.id}`} className="font-medium text-blue-600 hover:underline">
                        {course.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {course.progress}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-500">
                      {course.last_accessed ? new Date(course.last_accessed).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link 
                        href={`/student/courses/${course.id}/lessons`}
                        className="text-blue-600 hover:text-blue-800 inline-block mr-2"
                      >
                        <Book className="w-5 h-5" />
                      </Link>
                      <Link 
                        href={`/student/courses/${course.id}`}
                        className="text-gray-600 hover:text-gray-800 inline-block"
                      >
                        <ExternalLink className="w-5 h-5" />
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