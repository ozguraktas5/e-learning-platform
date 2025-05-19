'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { coursesApi, type CourseSearchParams, type SearchResponse } from '@/lib/api/courses';
import Link from 'next/link';
import { getFullUrl } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Search, Filter, ArrowUpDown, Clock, Users, Tag, BookOpen, Bookmark } from 'lucide-react';

const LEVELS = ['Başlangıç', 'Orta', 'İleri'];
const SORT_OPTIONS = [
  { value: 'created_at', label: 'En Yeni' },
  { value: 'popularity', label: 'En Popüler' },
  { value: 'price', label: 'Fiyat' },
  { value: 'title', label: 'İsim' }
];

interface SearchFilters {
  q: string;
  category?: string;
  level?: string;
  instructor_id?: number;
  min_price?: number;
  max_price?: number;
  sort_by: string;
  order: 'asc' | 'desc';
  page: number;
  per_page: number;
}

export default function CourseSearch() {
  const [filters, setFilters] = useState<SearchFilters>({
    q: '',
    category: undefined,
    level: undefined,
    instructor_id: undefined,
    sort_by: 'created_at',
    order: 'desc',
    page: 1,
    per_page: 10
  });

  // only debounce price filter
  const debouncedPrice = useDebounce({ min: filters.min_price, max: filters.max_price }, 300);

  // Kategorileri getir
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await coursesApi.getCategories();
      return response;
    }
  });

  // Eğitmenleri getir
  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      return await coursesApi.getInstructors();
    }
  });

  // Helper to get instructor username by ID
  const getInstructorName = (id: number) => instructors.find(instr => instr.id === id)?.username || 'Bilinmiyor';

  // Kursları getir
  const { data: searchResults, isLoading, error } = useQuery<SearchResponse, Error>({
    queryKey: ['courses', 'search', filters.q, filters.category, filters.level, filters.instructor_id, debouncedPrice, filters.sort_by, filters.order, filters.page],
    queryFn: () => {
      const params: CourseSearchParams = {
        query: filters.q,
        category: filters.category,
        level: filters.level,
        instructor_id: filters.instructor_id?.toString(),
        min_price: filters.min_price,
        max_price: filters.max_price,
        sort_by: filters.sort_by,
        order: filters.order,
        page: filters.page,
        per_page: filters.per_page,
      };
      return coursesApi.searchCourses(params);
    }
  });

  // Apply client-side filter on the raw search input (filters.q) for both title and description
  const filteredCourses = searchResults?.courses.filter(course => {
    const term = filters.q.toLowerCase();
    return (
      course.title.toLowerCase().includes(term) ||
      course.description.toLowerCase().includes(term)
    );
  }) ?? [];

  // Filtreleri güncelle
  const handleFilterChange = <K extends keyof SearchFilters>(name: K, value: SearchFilters[K]) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: name === 'page' ? (value as number) : 1
    } as SearchFilters));
  };

  // Sıralama yönünü değiştir
  const toggleOrder = () => {
    setFilters(prev => ({
      ...prev,
      order: prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Seviye badge renkleri
  const getLevelBadgeColor = (level: string) => {
    switch(level) {
      case 'Başlangıç': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Orta': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'İleri': return 'bg-purple-50 text-purple-600 border-purple-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Arama ve Filtreler */}
      <div>
        <div className="relative flex items-center mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="İlgilendiğin konuyu veya kursu ara..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
            value={filters.q}
            onChange={(e) => handleFilterChange('q', e.target.value)}
          />
        </div>
      
        <div className="border-b border-gray-100 pb-6">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-700">Filtreler</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Kategori Seçimi */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="h-4 w-4 text-indigo-500" />
              </div>
              <select
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm appearance-none"
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
              >
                <option value="">Tüm Kategoriler</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Seviye Seçimi */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BookOpen className="h-4 w-4 text-indigo-500" />
              </div>
              <select
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm appearance-none"
                value={filters.level || ''}
                onChange={(e) => handleFilterChange('level', e.target.value || undefined)}
              >
                <option value="">Tüm Seviyeler</option>
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Eğitmen Filtresi */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="h-4 w-4 text-indigo-500" />
              </div>
              <select
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm appearance-none"
                value={filters.instructor_id || ''}
                onChange={(e) => handleFilterChange('instructor_id', e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Tüm Eğitmenler</option>
                {instructors.map((instr) => (
                  <option key={instr.id} value={instr.id}>
                    {instr.username}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Sıralama */}
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ArrowUpDown className="h-4 w-4 text-indigo-500" />
                </div>
                <select
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm appearance-none"
                  value={filters.sort_by}
                  onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <button
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-indigo-500 shadow-sm"
                onClick={toggleOrder}
                aria-label={filters.order === 'asc' ? "Artan sıralama" : "Azalan sıralama"}
              >
                {filters.order === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Fiyat Aralığı */}
        <div className="py-5">
          <div className="flex items-center mb-4">
            <h3 className="text-sm font-medium text-gray-700">Fiyat Aralığı</h3>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="relative">
              <input
                type="number"
                placeholder="Min Fiyat"
                className="w-32 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
                value={filters.min_price || ''}
                onChange={(e) => handleFilterChange('min_price', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder="Max Fiyat"
                className="w-32 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
                value={filters.max_price || ''}
                onChange={(e) => handleFilterChange('max_price', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Yükleniyor ve Hata Durumları */}
      {isLoading && (
        <div className="text-center py-12">
          <LoadingSpinner size="medium" />
          <p className="mt-3 text-gray-500">Kurslar yükleniyor...</p>
        </div>
      )}

      {error && (
        <div className="text-center p-8 bg-red-50 rounded-xl border border-red-100">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium">Kurslar yüklenirken bir hata oluştu</p>
          <p className="text-sm text-red-500 mt-1">Lütfen daha sonra tekrar deneyin</p>
        </div>
      )}

      {/* Sonuçlar */}
      {searchResults && !isLoading && (
        <div>
          {filteredCourses.length === 0 ? (
            <div className="text-center p-10 bg-gray-50 rounded-xl">
              <div className="p-3 bg-indigo-100 rounded-full mx-auto w-16 h-16 flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-indigo-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Arama sonucu bulunamadı</h3>
              <p className="text-gray-500 mb-4">Farklı anahtar kelimeler ile tekrar arama yapmayı deneyin.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-6">
                <span className="font-medium text-gray-700">{filteredCourses.length}</span> kurs bulundu
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="h-48 bg-gray-200 relative">
                      {course.image_url ? (
                        <img
                          src={getFullUrl(course.image_url)}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-4xl font-bold"
                        >
                          {course.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {course.level && (
                        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${getLevelBadgeColor(course.level)}`}>
                          {course.level}
                        </div>
                      )}
                      {course.category && (
                        <div className="absolute top-3 right-3 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700 border border-gray-200">
                          {course.category}
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center text-gray-500 text-xs mb-2">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        <span>Yeni Eklendi</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-1">{course.title}</h3>
                      <div className="flex items-center text-gray-600 text-sm mb-3">
                        <Users className="h-4 w-4 mr-1 text-gray-400" />
                        <span>{getInstructorName(course.instructor_id)}</span>
                      </div>
                      <div
                        className="text-gray-600 mb-4 text-sm line-clamp-2 h-10"
                        dangerouslySetInnerHTML={{ __html: course.description }}
                      />
                      <div className="pt-3 mt-2 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                          {course.price ? `${course.price} TL` : 'Ücretsiz'}
                        </span>
                        <Link
                          href={`/student/courses/${course.id}`}
                          className="inline-flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          <Bookmark className="h-4 w-4" />
                          Detaylar
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Sayfalama */}
          {filteredCourses.length > 0 && searchResults.total_pages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-10">
              <button
                className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                disabled={filters.page <= 1}
                onClick={() => handleFilterChange('page', filters.page - 1)}
              >
                Önceki
              </button>
              <div className="flex items-center">
                <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-medium">
                  {filters.page}
                </span>
                <span className="mx-2 text-gray-500">/</span>
                <span className="text-gray-600">{searchResults.total_pages}</span>
              </div>
              <button
                className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                disabled={filters.page >= searchResults.total_pages}
                onClick={() => handleFilterChange('page', filters.page + 1)}
              >
                Sonraki
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 