'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { coursesApi, type Course } from '@/lib/api/courses';
import CourseList from '@/components/courses/CourseList';
import CourseListSkeleton from '@/components/courses/CourseListSkeleton';
import { useAuth } from '@/contexts/AuthContext';

export default function CoursesPage() {
  const { user } = useAuth();
  const isInstructor = user?.role === 'instructor';
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 0,
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = {
          sort_by: searchParams.get('sort_by') || 'created_at',
          order: (searchParams.get('order') || 'desc') as 'asc' | 'desc',
          page: Number(searchParams.get('page')) || 1,
          per_page: Number(searchParams.get('per_page')) || 10,
        };

        const response = await coursesApi.searchCourses(params);
        setCourses(response.courses);
        setPagination({
          total: response.total,
          page: response.page,
          per_page: response.per_page,
          total_pages: response.total_pages,
        });
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Kurslar yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [searchParams]);

  if (loading) {
    return <CourseListSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Kurslar</h1>
        {isInstructor && (
          <Link
            href="/courses/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Yeni Kurs Oluştur
          </Link>
        )}
      </div>
      <CourseList 
        courses={courses}
        pagination={pagination}
        onPageChange={(page) => {
          // URL'i güncelle
          const url = new URL(window.location.href);
          url.searchParams.set('page', page.toString());
          window.history.pushState({}, '', url);
        }}
      />
    </main>
  );
}