'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { coursesApi, Course } from '@/lib/api/courses';
import { toast } from 'react-hot-toast';

export default function CoursesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await coursesApi.searchCourses();
        setCourses(response.courses);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Kurslar yüklenirken bir hata oluştu.');
        toast.error('Kurslar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user, router]);

  // Sıralama işlevi
  const sortCourses = (a: Course, b: Course) => {
    if (sortBy === 'title') {
      return sortOrder === 'asc' 
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else if (sortBy === 'average_rating') {
      const aRating = a.average_rating || 0;
      const bRating = b.average_rating || 0;
      return sortOrder === 'asc' ? aRating - bRating : bRating - aRating;
    }
    
    // Varsayılan sıralama: oluşturma tarihine göre
    const aDate = new Date(a.created_at).getTime();
    const bDate = new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
  };

  // Filtreleme işlevi
  const filterCourses = (course: Course) => {
    // Önce arama sorgusuna göre filtrele
    if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Ardından duruma göre filtrele
    if (filterStatus === 'all') {
      return true;
    } else if (filterStatus === 'top-rated') {
      return (course.average_rating || 0) >= 4.5;
    } else if (filterStatus === 'beginner') {
      return course.level.toLowerCase() === 'başlangıç';
    }
    
    return true;
  };

  // Sıralama için sütun başlığı
  const renderSortableHeader = (label: string, key: string) => {
    const isActive = sortBy === key;
    
    return (
      <button 
        onClick={() => {
          if (isActive) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
          } else {
            setSortBy(key);
            setSortOrder('desc');
          }
        }}
        className={`flex items-center space-x-1 ${isActive ? 'text-blue-600' : 'text-gray-700'}`}
      >
        <span>{label}</span>
        {isActive && (
          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
        )}
      </button>
    );
  };

  const filteredAndSortedCourses = courses
    .filter(filterCourses)
    .sort(sortCourses);

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          <h3 className="font-medium text-xl">Hata</h3>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Kurslar</h1>
      </div>
      
      {/* Filtreleme ve Arama */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="w-full md:w-1/3">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Ara</label>
            <input
              type="text"
              id="search"
              placeholder="Kurs adına göre ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="w-full md:w-1/3">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Filtrele</label>
            <select
              id="status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Kurslar</option>
              <option value="top-rated">En İyi Değerlendirilenler</option>
              <option value="beginner">Başlangıç Seviyesi</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setSortBy('created_at');
                setSortOrder('desc');
              }}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-600"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>
      
      {/* Kurslar Tablosu */}
      {filteredAndSortedCourses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-10 text-center">
          <h3 className="text-xl font-medium text-gray-700">Hiç kurs bulunamadı</h3>
          <p className="mt-2 text-gray-500">
            {searchQuery || filterStatus !== 'all' 
              ? 'Arama kriterlerinize uygun kurs bulunamadı. Filtreleri değiştirmeyi deneyin.'
              : 'Henüz hiç kurs bulunmuyor.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-gray-700 text-sm">
                <tr>
                  <th className="py-3 px-4 text-left">{renderSortableHeader('Kurs Adı', 'title')}</th>
                  <th className="py-3 px-4 text-center">{renderSortableHeader('Değerlendirme', 'average_rating')}</th>
                  <th className="py-3 px-4 text-center">Eğitmen</th>
                  <th className="py-3 px-4 text-center">Kategori</th>
                  <th className="py-3 px-4 text-center">Fiyat</th>
                  <th className="py-3 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedCourses.map(course => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link href={`/student/courses/${course.id}`} className="text-blue-600 hover:underline font-medium">
                        {course.title}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">{course.description}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <span>{course.average_rating?.toFixed(1) || 'N/A'}</span>
                        {course.average_rating && course.average_rating > 0 && <span className="text-yellow-500 ml-1">★</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">{course.instructor_name}</td>
                    <td className="py-3 px-4 text-center">{course.category}</td>
                    <td className="py-3 px-4 text-center">{course.price} TL</td>
                    <td className="py-3 px-4 text-right">
                      <Link 
                        href={`/student/courses/${course.id}`}
                        className="text-blue-600 hover:text-blue-800 inline-block"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 