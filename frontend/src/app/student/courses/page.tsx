'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import CourseSearch from '@/components/courses/CourseSearch';
import { BookOpen, Plus } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-10 relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-200/30 via-purple-100/20 to-pink-200/30 rounded-3xl blur-2xl"></div>
          <div className="p-8 rounded-2xl backdrop-blur-sm bg-white/70 border border-indigo-100/50 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-8 w-8 text-indigo-600" />
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                  Keşfet ve Öğren
                </h1>
              </div>
              {isInstructor && (
                <Link
                  href="/instructor/courses/create"
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  <Plus className="h-5 w-5" />
                  Yeni Kurs Oluştur
                </Link>
              )}
            </div>
            <p className="text-gray-600 mt-2 ml-11">
              İlgi alanına göre kursları filtrele ve kariyer hedeflerine uygun eğitimlerle kendini geliştir.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-50">
          <CourseSearch />
        </div>
      </main>
    </div>
  );
} 