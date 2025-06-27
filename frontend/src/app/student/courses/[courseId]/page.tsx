'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { coursesApi, Course } from '@/lib/api/courses';
import { useAuth } from '@/contexts/AuthContext';
import { useEnrollment } from '@/lib/hooks/useEnrollment';
import Link from 'next/link';
import api from '@/lib/axios';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Book, Star, Users, Clock, ShoppingCart, Edit, Trash2, BookOpen, Award } from 'lucide-react';
import { translateLevelToTurkish } from '@/lib/utils/courseUtils';

export default function CourseDetail() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const { isEnrolled, loading: enrollmentLoading } = useEnrollment(Number(courseId));
  const [manualEnrollmentCheck, setManualEnrollmentCheck] = useState<boolean | null>(null);

  // Debug log
  useEffect(() => {
    console.log(`Course Detail - courseId: ${courseId}`);
    console.log(`Course Detail - isEnrolled: ${isEnrolled}`);
    console.log(`Course Detail - user:`, user);
  }, [courseId, isEnrolled, user]);

  // Daha sağlam bir şekilde kayıt durumunu doğrudan API üzerinden kontrol edelim
  useEffect(() => {
    const checkEnrollmentDirectly = async () => {
      if (!user || user.role !== 'student') return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        console.log('Direct API call to check enrollment status...');
        const directResponse = await api.get(`/courses/${courseId}/enrollment-status`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('Direct enrollment status response:', directResponse.data);
        setManualEnrollmentCheck(directResponse.data.is_enrolled);
      } catch (err) {
        console.error('Error in direct enrollment check:', err);
      }
    };
    
    checkEnrollmentDirectly();
  }, [courseId, user]);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await coursesApi.getCourse(Number(courseId));
        setCourse(response);
        console.log(`Fetched course data:`, response);
      } catch (error) {
        toast.error('Failed to load course details');
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please login to enroll in courses');
      return;
    }

    setEnrolling(true);
    try {
      const response = await coursesApi.enrollInCourse(Number(courseId));
      console.log('Enrollment response:', response);
      toast.success('Successfully enrolled in course!');
      // Sayfayı yenile
      window.location.reload();
    } catch (error) {
      toast.error('Failed to enroll in course');
      console.error('Error enrolling in course:', error);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading || enrollmentLoading) {
    return <LoadingSpinner fullScreen size="medium" />;
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-100 max-w-md w-full">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <Book className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Kurs Bulunamadı</h2>
            <p className="text-gray-600 mt-2">Aradığınız kurs sistemde bulunmuyor veya erişim izniniz yok.</p>
          </div>
          <Link
            href="/student/courses"
            className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg text-center font-medium shadow-md hover:shadow-lg transition-all duration-300"
          >
            Kurslara Dön
          </Link>
        </div>
      </div>
    );
  }

  // Doğrudan API çağrısı veya useEnrollment hook'unun sonucuna dayalı olarak kayıt durumunu belirle
  const effectiveEnrollmentStatus = manualEnrollmentCheck !== null ? manualEnrollmentCheck : isEnrolled;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Kurs Başlığı */}
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/30 via-purple-100/20 to-pink-200/30 rounded-3xl blur-2xl"></div>
          <div className="p-8 rounded-2xl backdrop-blur-sm bg-white/70 border border-indigo-100/50 shadow-xl">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                  {course.title}
                </h1>
                <div className="flex items-center mt-2 text-gray-600">
                  <div className="flex items-center mr-4">
                    <Award className="h-4 w-4 mr-1 text-amber-500" />
                    <span>{translateLevelToTurkish(course.level)}</span>
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-1 text-indigo-500" />
                    <span>{course.category}</span>
                  </div>
                </div>
              </div>
              
              {user?.role === 'instructor' && (
                <div className="flex space-x-3">
                  <Link
                    href={`/courses/${course.id}/edit`}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-md"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Düzenle</span>
                  </Link>
                  <button
                    onClick={async () => {
                      if (!confirm('Bu kursu silmek istediğinize emin misiniz?')) return;
                      try {
                        await coursesApi.deleteCourse(course.id.toString());
                        toast.success('Kurs başarıyla silindi');
                        router.push('/courses');
                      } catch (err) {
                        toast.error('Kurs silme işlemi başarısız');
                        console.error(err);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Sil</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Kurs İçeriği */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ana İçerik */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-indigo-50 overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Kurs Hakkında
                </h2>
              </div>
              <div className="p-6">
                <div className="prose prose-indigo max-w-none" dangerouslySetInnerHTML={{ __html: course.description }} />
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg border border-indigo-50 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Kurs İçeriği
                </h2>
              </div>
              <div className="p-6">
                <Link 
                  href={`/student/courses/${course.id}/lessons`}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 mb-4"
                >
                  <BookOpen className="h-5 w-5" />
                  Dersleri Görüntüle
                </Link>
                
                <Link 
                  href={`/student/courses/${course.id}/reviews`}
                  className="bg-white border border-purple-300 text-purple-700 px-6 py-3 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Star className="h-5 w-5" />
                  Değerlendirmeleri Görüntüle
                </Link>
              </div>
            </div>
          </div>
          
          {/* Sağ Panel */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg border border-indigo-50 overflow-hidden sticky top-6">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Kurs Bilgileri
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <div className="p-2 rounded-full bg-indigo-100">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Öğretmen</p>
                    <p className="font-medium">{course.instructor_name || 'Bilinmiyor'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <div className="p-2 rounded-full bg-amber-100">
                    <Star className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Değerlendirme</p>
                    <p className="font-medium">{course.average_rating || '0'}/5</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <div className="p-2 rounded-full bg-emerald-100">
                    <Clock className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Süre</p>
                    <p className="font-medium">{course.duration || 'Belirtilmemiş'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 py-2">
                  <div className="p-2 rounded-full bg-pink-100">
                    <ShoppingCart className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fiyat</p>
                    <p className="font-medium">{course.price} TL</p>
                  </div>
                </div>
                
                <div className="pt-6">
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling || effectiveEnrollmentStatus}
                    className={`w-full py-3 px-4 rounded-lg font-medium shadow-md transition-all duration-300 flex items-center justify-center gap-2 ${
                      effectiveEnrollmentStatus
                        ? 'bg-gray-100 text-gray-500 border border-gray-300' 
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                    }`}
                  >
                    {enrolling ? 'Kayıt Olunuyor...' : effectiveEnrollmentStatus ? 'Kayıt Olundu' : 'Şimdi Kayıt Ol'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}