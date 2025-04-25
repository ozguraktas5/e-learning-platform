'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { coursesApi, type CourseSearchParams, type SearchResponse } from '@/lib/api/courses';
import Link from 'next/link';

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

  return (
    <div className="space-y-4">
      {/* Arama ve Filtreler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Arama Kutusu */}
        <div>
          <input
            type="text"
            placeholder="Kurs Ara..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filters.q}
            onChange={(e) => handleFilterChange('q', e.target.value)}
          />
        </div>

        {/* Kategori Seçimi */}
        <div>
          <select
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
        </div>

        {/* Seviye Seçimi */}
        <div>
          <select
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
        </div>

        {/* Eğitmen Filtresi */}
        <div>
          <select
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
        </div>

        {/* Sıralama */}
        <div className="flex space-x-2">
          <select
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filters.sort_by}
            onChange={(e) => handleFilterChange('sort_by', e.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            onClick={toggleOrder}
          >
            {filters.order === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Fiyat Aralığı */}
      <div className="flex space-x-4">
        <input
          type="number"
          placeholder="Min Fiyat"
          className="w-32 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          value={filters.min_price || ''}
          onChange={(e) => handleFilterChange('min_price', e.target.value ? Number(e.target.value) : undefined)}
        />
        <input
          type="number"
          placeholder="Max Fiyat"
          className="w-32 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          value={filters.max_price || ''}
          onChange={(e) => handleFilterChange('max_price', e.target.value ? Number(e.target.value) : undefined)}
        />
      </div>

      {/* Yükleniyor ve Hata Durumları */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-600">
          Kurslar yüklenirken bir hata oluştu
        </div>
      )}

      {/* Sonuçlar */}
      {searchResults && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {course.image_url && (
                  <img
                    src={course.image_url}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                  <p className="text-gray-700 text-sm mb-3">
                    Eğitmen: {getInstructorName(course.instructor_id)}
                  </p>
                  <p
                    className="text-gray-600 mb-4 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: course.description }}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-blue-600 font-medium">
                      {course.price ? `${course.price} TL` : 'Ücretsiz'}
                    </span>
                    <Link
                      href={`/courses/${course.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Detaylar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sayfalama */}
          {filteredCourses.length > 0 && searchResults.total_pages > 1 && (
            <div className="flex justify-center space-x-2 mt-8">
              <button
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
                disabled={filters.page <= 1}
                onClick={() => handleFilterChange('page', filters.page - 1)}
              >
                Önceki
              </button>
              <span className="px-4 py-2">
                Sayfa {filters.page} / {searchResults.total_pages}
              </span>
              <button
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
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