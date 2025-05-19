'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Book, Award, Bell, LineChart, ExternalLink, Clock, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { getImageUrl } from '@/lib/axios';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Cookie yardımcı fonksiyonu
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';').shift() || '');
  return '';
};

interface EnrolledCourse {
  id: string;
  title: string;
  progress: number;
  image_url?: string;
  last_accessed?: string;
}

interface Activity {
  id: string;
  type: 'completion' | 'enrollment' | 'certificate' | 'system';
  title: string;
  description: string;
  course_id?: string;
  course_title?: string;
  date: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
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
        const [coursesResponse, activitiesResponse, notificationsResponse] = await Promise.all([
          axios.get(`${API_URL}/api/student/enrolled-courses`, {
            headers: { Authorization: `Bearer ${authToken}` }
          }),
          axios.get(`${API_URL}/api/student/activities`, {
            headers: { Authorization: `Bearer ${authToken}` }
          }),
          axios.get(`${API_URL}/api/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${authToken}` }
          })
        ]);

        setEnrolledCourses(coursesResponse.data.courses || []);
        setRecentActivities(activitiesResponse.data.activities || []);
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50">
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-md" role="alert">
            <p className="font-bold">Hata</p>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-sm transition-all duration-200 shadow-sm"
            >
              Yeniden Dene
            </button>
          </div>
        )}
        
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/30 via-purple-100/20 to-pink-200/30 rounded-3xl blur-2xl"></div>
          <div className="p-8 rounded-2xl backdrop-blur-sm bg-white/70 border border-indigo-100/50 shadow-xl">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              Hoş Geldin, {user.username}!
            </h1>
            <p className="text-gray-600 mt-3 text-lg">
              Eğitim yolculuğunda ilerlemeni takip et ve yeni kurslar keşfet.
            </p>
          </div>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md">
                <Book className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-indigo-500">Kayıtlı Kurslar</p>
                <p className="text-2xl font-bold text-gray-800">{enrolledCourses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md">
                <LineChart className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-emerald-500">Ortalama İlerleme</p>
                <p className="text-2xl font-bold text-gray-800">
                  {enrolledCourses.length 
                    ? Math.round(enrolledCourses.reduce((sum, course) => sum + course.progress, 0) / enrolledCourses.length) 
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-md">
                <Award className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-500">Tamamlanan</p>
                <p className="text-2xl font-bold text-gray-800">
                  {enrolledCourses.filter(course => course.progress === 100).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md">
                <Bell className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-pink-500">Bildirimler</p>
                <p className="text-2xl font-bold text-gray-800">{unreadCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ana İçerik Bölümü */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Devam Eden Kurslar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-indigo-50 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Devam Eden Kurslar
                </h2>
                <Link 
                  href="/student/my-courses" 
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  <span>Tümünü Görüntüle</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="p-6">
                {enrolledCourses.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-indigo-100 rounded-full mx-auto w-16 h-16 flex items-center justify-center mb-4">
                      <Book className="h-8 w-8 text-indigo-500" />
                    </div>
                    <p className="text-gray-600 mb-3">Henüz hiç kursa kayıt olmadınız.</p>
                    <Link 
                      href="/student/courses" 
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      Kursları Keşfet
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {enrolledCourses.slice(0, 4).map((course) => (
                      <div 
                        key={course.id} 
                        className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                      >
                        <div className="h-40 bg-gray-200 relative">
                          {course.image_url ? (
                            <img 
                              src={getImageUrl(course.image_url)} 
                              alt={course.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-4xl font-bold">
                              {course.title.charAt(0).toUpperCase()}
                            </div>
                          )}
                          
                          {/* İlerleme göstergesi - üst kısımda */}
                          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="p-5">
                          <div className="flex justify-between items-center mb-3">
                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full">{course.progress}% tamamlandı</span>
                            
                            {course.last_accessed && (
                              <div className="flex items-center text-gray-400 text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>Son: {new Date(course.last_accessed).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                          
                          <h3 className="font-bold text-lg mb-3 text-gray-800 line-clamp-1">{course.title}</h3>
                          
                          <Link 
                            href={`/student/courses/${course.id}`}
                            className="inline-block w-full text-center py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-300"
                          >
                            Devam Et
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Son Aktiviteler */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-indigo-50 overflow-hidden h-full">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                  Son Aktiviteler
                </h2>
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100% - 4rem)' }}>
                {recentActivities.length === 0 ? (
                  <div className="text-center py-10 px-6">
                    <div className="p-3 bg-pink-100 rounded-full mx-auto w-16 h-16 flex items-center justify-center mb-4">
                      <Bell className="h-8 w-8 text-pink-500" />
                    </div>
                    <p className="text-gray-600">Henüz hiç aktivite yok.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {recentActivities.slice(0, 6).map((activity) => (
                      <li key={activity.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                        <div className="flex space-x-4">
                          <div className="flex-shrink-0">
                            {activity.type === 'enrollment' && (
                              <div className="p-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-sm">
                                <Book className="h-5 w-5" />
                              </div>
                            )}
                            {activity.type === 'completion' && (
                              <div className="p-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-sm">
                                <Award className="h-5 w-5" />
                              </div>
                            )}
                            {activity.type === 'certificate' && (
                              <div className="p-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-sm">
                                <Award className="h-5 w-5" />
                              </div>
                            )}
                            {activity.type === 'system' && (
                              <div className="p-2 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm">
                                <Bell className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <p className="text-sm text-gray-500 line-clamp-2">{activity.description}</p>
                            {activity.course_title && (
                              <p className="text-xs text-indigo-400 mt-1 font-medium">
                                {activity.course_title}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(activity.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 