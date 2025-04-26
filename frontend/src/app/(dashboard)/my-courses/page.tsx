'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { enrollmentApi, MyCourseEnrollment } from '@/lib/api/enrollments';

export default function MyCoursesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<MyCourseEnrollment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if auth has loaded and no user
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Once authenticated, fetch enrollments
  useEffect(() => {
    if (authLoading || !user) return;
    const fetchMyCourses = async () => {
      try {
        const data = await enrollmentApi.getMyCourses();
        setEnrollments(data);
      } catch (err) {
        console.error('Error fetching my courses:', err);
        setError('Kayıtlı kurslar yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    fetchMyCourses();
  }, [authLoading, user]);

  if (authLoading || loading) {
    return <div className="text-center py-8">Yükleniyor...</div>;
  }
  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }
  if (enrollments.length === 0) {
    return <div className="text-center py-8">Henüz kayıtlı kursunuz yok.</div>;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Kayıtlı Kurslarım</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrollments.map((en) => {
          const progressPercent = Math.floor(
            (en.course.progress.completed_lessons / en.course.progress.total_lessons) * 100
          );
          return (
            <Link key={en.enrollment_id} href={`/courses/${en.course.id}`}> 
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow p-6">
                <h2 className="text-xl font-semibold mb-2">{en.course.title}</h2>
                <p className="text-gray-600 mb-4 line-clamp-2">{en.course.description}</p>
                <div className="text-sm text-gray-500">İlerleme: {progressPercent}%</div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
} 