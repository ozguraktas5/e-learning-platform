'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { courseApi } from '@/lib/api/courses';
import { Course } from '@/types/course';
import { useAuth } from '@/lib/hooks/useAuth';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    sort_by: 'created_at',
    order: 'desc' as 'asc' | 'desc'
  });

  useEffect(() => {
    fetchCourses();
  }, [filters]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await courseApi.getCourses(filters);
      setCourses(data);
    } catch (err) {
      setError('Kurslar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kurslar</h1>
        {user?.role === 'instructor' && (
          <button
            onClick={() => router.push('/courses/create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Yeni Kurs Oluştur
          </button>
        )}
      </div>

      {/* Filtreler */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Kurs ara..."
          className="px-4 py-2 border rounded-lg flex-1"
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
        />
        <select
          className="px-4 py-2 border rounded-lg"
          value={filters.category}
          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
        >
          <option value="">Tüm Kategoriler</option>
          <option value="programming">Programlama</option>
          <option value="design">Tasarım</option>
          <option value="business">İş</option>
        </select>
        <select
          className="px-4 py-2 border rounded-lg"
          value={filters.sort_by}
          onChange={(e) => setFilters(prev => ({ ...prev, sort_by: e.target.value }))}
        >
          <option value="created_at">Oluşturma Tarihi</option>
          <option value="title">İsim</option>
          <option value="price">Fiyat</option>
        </select>
      </div>

      {/* Kurs Listesi */}
      {loading ? (
        <div className="text-center py-8">Yükleniyor...</div>
      ) : error ? (
        <div className="text-red-600 text-center py-8">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">
                  <a 
                    href={`/courses/${course.id}`}
                    className="hover:text-blue-600"
                  >
                    {course.title}
                  </a>
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {course.instructor.username}
                  </span>
                  <span className="font-bold text-blue-600">
                    {course.price === 0 ? 'Ücretsiz' : `${course.price}₺`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}