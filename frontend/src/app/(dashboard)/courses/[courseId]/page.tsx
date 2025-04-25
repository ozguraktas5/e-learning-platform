'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { coursesApi, Course } from '@/lib/api/courses';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function CourseDetail() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await coursesApi.getCourse(Number(courseId));
        setCourse(response);
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
      await coursesApi.enrollInCourse(Number(courseId));
      toast.success('Successfully enrolled in course!');
    } catch (error) {
      toast.error('Failed to enroll in course');
      console.error('Error enrolling in course:', error);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (!course) {
    return <div>Kurs bulunamadı</div>;
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{course.title}</h1>
        {user?.role === 'instructor' && (
          <div className="flex space-x-2">
            <Link
              href={`/courses/${course.id}/edit`}
              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Düzenle
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
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sil
            </button>
          </div>
        )}
      </div>
      <p className="mb-4" dangerouslySetInnerHTML={{ __html: course.description }} />
      <div className="mb-4">
        <p>Kategori: {course.category}</p>
        <p>Seviye: {course.level}</p>
        <p>Fiyat: {course.price} TL</p>
      </div>
      <button
        onClick={handleEnroll}
        disabled={enrolling}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {enrolling ? 'Kayıt Olunuyor...' : 'Şimdi Kayıt Ol'}
      </button>
    </div>
  );
}