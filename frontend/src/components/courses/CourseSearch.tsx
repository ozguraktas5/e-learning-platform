'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '@/lib/api/courses';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'react-toastify';

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
    sort_by: 'created_at',
    order: 'desc',
    page: 1,
    per_page: 10
  });

  const debouncedSearch = useDebounce(filters.q, 300);
  const debouncedPrice = useDebounce({ min: filters.min_price, max: filters.max_price }, 300);

  // Kategorileri getir
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await coursesApi.getCategories();
      return response;
    }
  });

  // Kursları getir
  const {
    data: searchResults,
    isLoading,
    error
  } = useQuery({
    queryKey: ['courses', 'search', debouncedSearch, filters.category, filters.level, debouncedPrice, filters.sort_by, filters.order, filters.page],
    queryFn: async () => {
      try {
        const response = await coursesApi.searchCourses(filters);
        return response;
      } catch (error) {
        toast.error('Kurslar yüklenirken bir hata oluştu');
        throw error;
      }
    }
  });

  // Filtreleri güncelle
  const handleFilterChange = (name: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: name === 'page' ? value : 1 // Filtre değiştiğinde sayfa 1'e dön
    }));
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
            {searchResults.courses.map((course) => (
              <div key={course.id} className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold">{course.title}</h3>
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">{course.description}</p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-500">{course.instructor.username}</span>
                  <span className="text-sm font-semibold">{course.price ? `${course.price}₺` : 'Ücretsiz'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Sayfalama */}
          {searchResults.total_pages > 1 && (
            <div className="flex justify-center space-x-2 mt-8">
              <button
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
                disabled={!searchResults.has_prev}
                onClick={() => handleFilterChange('page', filters.page - 1)}
              >
                Önceki
              </button>
              <span className="px-4 py-2">
                Sayfa {filters.page} / {searchResults.total_pages}
              </span>
              <button
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
                disabled={!searchResults.has_next}
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