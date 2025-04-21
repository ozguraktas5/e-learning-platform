'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import CourseList from '@/components/courses/CourseList';
import CourseListSkeleton from '@/components/courses/CourseListSkeleton';
import { useAuth } from '@/hooks/useAuth'

export default function CoursesPage() {
  const { user } = useAuth();
  const isInstructor = user?.role === 'instructor';

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Kurslar</h1>
        {isInstructor && (
          <Link
            href="/courses/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Kurs Ekle
          </Link>
        )}
      </div>
      <Suspense fallback={<CourseListSkeleton />}>
        <CourseList />
      </Suspense>
    </main>
  );
}