'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useAuth } from '@/hooks/useAuth';
import { enrollmentsApi } from '@/lib/api/enrollments';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { BookOpen, User, Calendar, Clock, ArrowRight, Search, ExternalLink } from 'lucide-react';

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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50">
        <div className="max-w-7xl mx-auto p-8">
          <div className="mb-10 relative">
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-200/30 via-purple-100/20 to-pink-200/30 rounded-3xl blur-2xl"></div>
            <div className="p-8 rounded-2xl backdrop-blur-sm bg-white/70 border border-indigo-100/50 shadow-xl">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-8 w-8 text-indigo-600" />
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                  Kayıtlı Kurslarım
                </h1>
              </div>
            </div>
          </div>

          <div className="text-center p-12 bg-white rounded-2xl shadow-lg border border-indigo-50">
            <div className="p-6 bg-indigo-50 rounded-full mx-auto w-24 h-24 flex items-center justify-center mb-6">
              <Search className="h-12 w-12 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Henüz hiçbir kursa kayıtlı değilsiniz</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Öğrenmeye başlamak için kursları keşfedin ve kendinizi geliştirin
            </p>
            <Link 
              href="/student/courses" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              Kursları Keşfet
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-10 relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-200/30 via-purple-100/20 to-pink-200/30 rounded-3xl blur-2xl"></div>
          <div className="p-8 rounded-2xl backdrop-blur-sm bg-white/70 border border-indigo-100/50 shadow-xl">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                Kayıtlı Kurslarım
              </h1>
            </div>
            <p className="text-gray-600 mt-2 ml-11">
              Kayıtlı olduğunuz kursları görüntüleyin ve öğrenmeye devam edin
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div 
              key={course.id} 
              className="bg-white rounded-xl shadow-lg border border-indigo-50 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="relative h-52 w-full">
                {course.image_url ? (
                  <div className="h-full w-full relative">
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
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">{course.title.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                
                {course.progress !== undefined && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                )}
              </div>
              
              <div className="p-6 flex-grow">
                {course.progress !== undefined && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full">
                      {course.progress}% tamamlandı
                    </span>
                  </div>
                )}
                
                <h2 className="text-xl font-bold text-gray-800 mb-3 line-clamp-1">{course.title}</h2>
                
                <div className="flex items-center text-gray-600 text-sm mb-4">
                  <User className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{course.instructor_name}</span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-indigo-400" />
                    <span>Kayıt: {new Date(course.enrolled_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                  
                  {course.last_activity_at && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-indigo-400" />
                      <span>Son aktivite: {new Date(course.last_activity_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 pt-2">
                <Link
                  href={`/student/courses/${course.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <span>Kursa Git</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 