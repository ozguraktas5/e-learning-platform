'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { courseApi } from '@/lib/api/courses';
import { Course } from '@/types/course';
import { useAuth } from '@/lib/hooks/useAuth';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const data = await courseApi.getCourse(Number(courseId));
      setCourse(data);
    } catch (err) {
      setError('Kurs detayları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      await courseApi.enrollCourse(Number(courseId));
      router.refresh();
    } catch (err) {
      setError('Kursa kayıt olurken bir hata oluştu');
    } finally {
      setEnrolling(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Bu kursu silmek istediğinizden emin misiniz?')) {
      try {
        await courseApi.deleteCourse(Number(courseId));
        router.push('/courses');
      } catch (err) {
        setError('Kurs silinirken bir hata oluştu');
      }
    }
  };

  if (loading) return <div className="text-center py-8">Yükleniyor...</div>;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;
  if (!course) return <div className="text-center py-8">Kurs bulunamadı</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold">{course.title}</h1>
            {user?.id === course.instructor_id && (
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/courses/${courseId}/edit`)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Düzenle
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Sil
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="prose max-w-none">
                <p className="text-gray-600">{course.description}</p>
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Kurs Detayları</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">Kategori</p>
                    <p className="font-medium">{course.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Seviye</p>
                    <p className="font-medium">{course.level}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Eğitmen</p>
                    <p className="font-medium">{course.instructor.username}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Kayıtlı Öğrenci</p>
                    <p className="font-medium">{course.enrollment_count}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="text-3xl font-bold mb-4">
                {course.price === 0 ? 'Ücretsiz' : `${course.price}₺`}
              </div>
              {user?.role === 'student' && (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {enrolling ? 'Kaydolunuyor...' : 'Kursa Kaydol'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}