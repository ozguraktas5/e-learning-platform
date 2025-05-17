'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useAuth } from '@/hooks/useAuth';
import { enrollmentsApi } from '@/lib/api/enrollments';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Course {
  id: number;
  title: string;
  description: string;
  image_url: string;
  instructor_name: string;
  progress?: number;
  enrolled_at: string;
  last_activity_at?: string;
}

export default function MyCoursesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Eğitmen ise kendi kurslarına yönlendir
    if (user.role === 'instructor') {
      router.push('/instructor/courses');
      return;
    }
    
    fetchEnrolledCourses();
  }, [loading, user, router]);

  const fetchEnrolledCourses = async () => {
    try {
      setIsLoading(true);
      const data = await enrollmentsApi.getEnrolledCourses();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      toast.error('Kurslar yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return <LoadingSpinner size="large" fullScreen />;
  }

  if (courses.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-8">Kayıtlı Kurslarım</h1>
        <div className="text-center p-10 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Henüz hiçbir kursa kayıtlı değilsiniz</h2>
          <p className="text-gray-600 mb-6">
            Öğrenmeye başlamak için kursları keşfedin ve kaydolun
          </p>
          <Link 
            href="/courses" 
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Kursları Keşfet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Kayıtlı Kurslarım</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course.id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
            <div className="relative h-48 w-full">
              {course.image_url ? (
                <div className="h-full w-full relative">
                  {/* Backend üzerinden resmi yükle */}
                  <img
                    src={`http://localhost:5000${course.image_url}`}
                    alt={course.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Resim yüklenemedi:', course.image_url);
                      // Target'ı HTMLImageElement olarak belirt
                      const target = e.target as HTMLImageElement;
                      // Alternatif kaynak belirt
                      target.src = "https://via.placeholder.com/800x600?text=E-Learning";
                    }}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">Resim yok</span>
                </div>
              )}
            </div>
            
            <div className="p-5 flex-grow">
              <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
              <p className="text-sm text-gray-600 mb-2">Eğitmen: {course.instructor_name}</p>
              
              {course.progress !== undefined && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>İlerleme</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              )}
              
              <div className="mt-4 text-sm text-gray-500">
                <p>Kayıt tarihi: {new Date(course.enrolled_at).toLocaleDateString('tr-TR')}</p>
                {course.last_activity_at && (
                  <p>Son aktivite: {new Date(course.last_activity_at).toLocaleDateString('tr-TR')}</p>
                )}
              </div>
            </div>
            
            <div className="p-5 pt-0">
              <Link
                href={`/courses/${course.id}`}
                className="block w-full text-center py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Kursa Git
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 