'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Book, Award, Bell, LineChart } from 'lucide-react';
import axios from 'axios';

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
      try {
        // Token'ı hem localStorage hem cookie'den al
        const authToken = localStorage.getItem('token') || getCookie('token');
        if (!authToken) {
          console.error('Token bulunamadı');
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
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'student') {
      fetchDashboardData();
    }
  }, [user, router]);

  if (!user || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hoş Geldin, {user.username}!</h1>
        <p className="text-gray-600 mt-2">Eğitim yolculuğunda ilerlemeni takip et ve yeni kurslar keşfet.</p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Book className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Kayıtlı Kurslar</p>
              <p className="text-2xl font-semibold">{enrolledCourses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <LineChart className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Ortalama İlerleme</p>
              <p className="text-2xl font-semibold">
                {enrolledCourses.length 
                  ? Math.round(enrolledCourses.reduce((sum, course) => sum + course.progress, 0) / enrolledCourses.length) 
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Award className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Tamamlanan</p>
              <p className="text-2xl font-semibold">
                {enrolledCourses.filter(course => course.progress === 100).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <Bell className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Bildirimler</p>
              <p className="text-2xl font-semibold">{unreadCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Devam Eden Kurslar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Devam Eden Kurslar</h2>
          <Link 
            href="/student/my-courses" 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Tümünü Görüntüle
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.length === 0 ? (
            <div className="col-span-full text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Henüz hiç kursa kayıt olmadınız.</p>
              <Link 
                href="/student/courses" 
                className="mt-2 inline-block text-blue-600 hover:text-blue-800"
              >
                Kursları Keşfet
              </Link>
            </div>
          ) : (
            enrolledCourses.slice(0, 3).map((course) => (
              <div 
                key={course.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100"
              >
                <div className="h-40 bg-gray-200">
                  {course.image_url ? (
                    <img 
                      src={course.image_url} 
                      alt={course.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-500 text-white text-4xl font-bold">
                      {course.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-2 truncate">{course.title}</h3>
                  
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">İlerleme</span>
                      <span className="text-xs font-medium">{course.progress}%</span>
                    </div>
                  </div>
                  
                  <Link 
                    href={`/student/courses/${course.id}`}
                    className="inline-block w-full text-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Devam Et
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Son Aktiviteler */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Son Aktiviteler</h2>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-100">
          {recentActivities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Henüz hiç aktivite yok.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {recentActivities.slice(0, 5).map((activity) => (
                <li key={activity.id} className="p-4 hover:bg-gray-50">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      {activity.type === 'enrollment' && (
                        <div className="p-2 rounded-full bg-green-100 text-green-600">
                          <Book className="h-5 w-5" />
                        </div>
                      )}
                      {activity.type === 'completion' && (
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                          <Award className="h-5 w-5" />
                        </div>
                      )}
                      {activity.type === 'certificate' && (
                        <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                          <Award className="h-5 w-5" />
                        </div>
                      )}
                      {activity.type === 'system' && (
                        <div className="p-2 rounded-full bg-gray-100 text-gray-600">
                          <Bell className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      {activity.course_title && (
                        <p className="text-xs text-gray-400 mt-1">
                          {activity.course_title}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      {new Date(activity.date).toLocaleDateString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 