'use client';

import { useState, useEffect } from 'react';
import { coursesApi, Course } from '@/lib/api/courses';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface InstructorCourse extends Course {
  student_count: number;
  average_rating?: number;
  completion_rate?: number;
  revenue?: number;
  last_updated?: string;
  published?: boolean;
}

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        
        // Get all courses and filter for current instructor
        const allCourses = await coursesApi.getAllCourses();
        
        // Dönüştürme ve sahte veri ekleme (gerçek API tam işlevsel olduğunda kaldırılabilir)
        const mockCourses: InstructorCourse[] = allCourses.map(course => ({
          ...course,
          student_count: Math.floor(Math.random() * 100), // Sahte öğrenci sayısı
          average_rating: Math.round((Math.random() * 4 + 1) * 10) / 10, // 1-5 arası rastgele puan
          completion_rate: Math.floor(Math.random() * 100), // 0-100 arası tamamlanma oranı
          revenue: Math.floor(Math.random() * 10000), // 0-10000 arası gelir
          last_updated: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
        }));
        
        setCourses(mockCourses);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Kurslar yüklenirken bir hata oluştu.');
        toast.error('Kurslar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchCourses();
  }, []);

  // Sıralama işlevi
  const sortCourses = (a: InstructorCourse, b: InstructorCourse) => {
    if (sortBy === 'title') {
      return sortOrder === 'asc' 
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else if (sortBy === 'student_count') {
      return sortOrder === 'asc'
        ? a.student_count - b.student_count
        : b.student_count - a.student_count;
    } else if (sortBy === 'average_rating') {
      const aRating = a.average_rating || 0;
      const bRating = b.average_rating || 0;
      return sortOrder === 'asc' ? aRating - bRating : bRating - aRating;
    } else if (sortBy === 'revenue') {
      const aRevenue = a.revenue || 0;
      const bRevenue = b.revenue || 0;
      return sortOrder === 'asc' ? aRevenue - bRevenue : bRevenue - aRevenue;
    } else if (sortBy === 'last_updated') {
      const aDate = new Date(a.last_updated || a.updated_at || a.created_at).getTime();
      const bDate = new Date(b.last_updated || b.updated_at || b.created_at).getTime();
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    }
    
    // Varsayılan sıralama: oluşturma tarihine göre
    const aDate = new Date(a.created_at).getTime();
    const bDate = new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
  };

  // Filtreleme işlevi
  const filterCourses = (course: InstructorCourse) => {
    // Önce arama sorgusuna göre filtrele
    if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Ardından duruma göre filtrele
    if (filterStatus === 'all') {
      return true;
    } else if (filterStatus === 'published') {
      return course.published !== false; // varsayılan olarak yayımlanmış kabul et
    } else if (filterStatus === 'draft') {
      return course.published === false;
    } else if (filterStatus === 'popular') {
      return (course.student_count || 0) > 50; // 50'den fazla öğrenci = popüler
    } else if (filterStatus === 'low-rated') {
      return (course.average_rating || 0) < 3.5; // 3.5'ten düşük puan
    }
    
    return true;
  };

  // Tarih formatı
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    }).format(date);
  };

  // Para birimi formatı
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
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
            setSortOrder('desc'); // Yeni sıralama sütunları varsayılan olarak azalan
          }
        }}
        className={`flex items-center space-x-1 ${isActive ? 'text-blue-600' : 'text-gray-700'}`}
      >
        <span>{label}</span>
        {isActive && (
          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
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
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Kurslarım</h1>
        <Link
          href="/courses/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Yeni Kurs Oluştur
        </Link>
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
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
            <select
              id="status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Kurslar</option>
              <option value="published">Yayında</option>
              <option value="draft">Taslak</option>
              <option value="popular">Popüler Kurslar</option>
              <option value="low-rated">Düşük Puanlı</option>
            </select>
          </div>
          
          <div className="w-full md:w-1/3 flex justify-end items-end">
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
          <h3 className="text-xl font-medium text-gray-700">Hiç kursunuz bulunamadı</h3>
          <p className="mt-2 text-gray-500">
            {searchQuery || filterStatus !== 'all' 
              ? 'Arama kriterlerinize uygun kurs bulunamadı. Filtreleri değiştirmeyi deneyin.'
              : 'Henüz hiç kurs oluşturmadınız. "Yeni Kurs Oluştur" düğmesini kullanarak ilk kursunuzu oluşturabilirsiniz.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-gray-700 text-sm">
                <tr>
                  <th className="py-3 px-4 text-left">{renderSortableHeader('Kurs Adı', 'title')}</th>
                  <th className="py-3 px-4 text-center">{renderSortableHeader('Öğrenci', 'student_count')}</th>
                  <th className="py-3 px-4 text-center">{renderSortableHeader('Ort. Puan', 'average_rating')}</th>
                  <th className="py-3 px-4 text-center">{renderSortableHeader('Tamamlanma', 'completion_rate')}</th>
                  <th className="py-3 px-4 text-center">{renderSortableHeader('Gelir', 'revenue')}</th>
                  <th className="py-3 px-4 text-center">{renderSortableHeader('Son Güncelleme', 'last_updated')}</th>
                  <th className="py-3 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAndSortedCourses.map(course => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                          {course.image_url ? (
                            <img 
                              src={course.image_url} 
                              alt={course.title} 
                              className="h-full w-full object-cover" 
                              onError={(e) => {
                                // Hide the broken image and display the fallback
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.classList.add('bg-blue-100', 'text-blue-500', 'flex', 'items-center', 'justify-center');
                                e.currentTarget.parentElement!.innerHTML = `<span>${course.title.charAt(0)}</span>`;
                              }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500">
                              <span>{course.title.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <Link 
                            href={`/instructor/courses/${course.id}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {course.title}
                          </Link>
                          <p className="text-sm text-gray-500">{course.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">{course.student_count}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <span className="mr-1">{(course.average_rating || 0).toFixed(1)}</span>
                        <span className="text-yellow-500">★</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${course.completion_rate || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {Math.round(course.completion_rate || 0)}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {formatCurrency(course.revenue || 0)}
                    </td>
                    <td className="py-4 px-4 text-center text-sm text-gray-500">
                      {formatDate(course.last_updated || course.updated_at || course.created_at)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Link 
                          href={`/courses/${course.id}/lessons`}
                          className="p-1 text-gray-500 hover:text-blue-600"
                          title="Dersleri Düzenle"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                          </svg>
                        </Link>
                        <Link 
                          href={`/instructor/courses/${course.id}/analytics`}
                          className="p-1 text-gray-500 hover:text-green-600"
                          title="Analitikler"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                          </svg>
                        </Link>
                        <Link 
                          href={`/instructor/courses/${course.id}/edit`}
                          className="p-1 text-gray-500 hover:text-amber-600"
                          title="Düzenle"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {filteredAndSortedCourses.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Toplam {filteredAndSortedCourses.length} kurs gösteriliyor
        </div>
      )}
    </div>
  );
} 