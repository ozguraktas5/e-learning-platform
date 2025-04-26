'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import CourseSearch from '@/components/courses/CourseSearch';

export default function CoursesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isInstructor = user?.role === 'instructor';

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
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
      <div className="mb-6">
        <CourseSearch />
      </div>
    </main>
  );
} 