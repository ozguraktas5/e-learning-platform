'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { coursesApi, Course } from '@/lib/api/courses';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { translateLevelToTurkish } from '@/lib/utils/courseUtils';
import { BookOpen, Search, Filter, Star, User, Tag, DollarSign, Eye, ArrowUpDown, X } from 'lucide-react';

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
      return course.level.toLowerCase() === 'beginner';
    }
    
    return true;
  };

  const filteredAndSortedCourses = courses
    .filter(filterCourses)
    .sort(sortCourses);

  if (loading) {
    return <LoadingSpinner size="large" fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50">
        <div className="container mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 shadow-lg">
            <h3 className="font-semibold text-xl mb-2">Hata Oluştu</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-10 relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-200/30 via-purple-100/20 to-pink-200/30 rounded-3xl blur-2xl"></div>
          <div className="p-8 rounded-2xl backdrop-blur-sm bg-white/70 border border-indigo-100/50 shadow-xl">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                Tüm Kurslar
              </h1>
            </div>
            <p className="text-gray-600 mt-2 ml-11">
              Mevcut tüm kursları keşfedin ve öğrenmeye başlayın
            </p>
          </div>
        </div>
        
        {/* Filtreleme ve Arama */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-indigo-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
                <Search className="inline h-4 w-4 mr-1" />
                Kurs Ara
              </label>
              <input
                type="text"
                id="search"
                placeholder="Kurs adına göre ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
            </div>
            
            <div className="flex-1">
              <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
                <Filter className="inline h-4 w-4 mr-1" />
                Filtrele
              </label>
              <select
                id="status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              >
                <option value="all">Tüm Kurslar</option>
                <option value="top-rated">En İyi Değerlendirilenler (4.5+)</option>
                <option value="beginner">Başlangıç Seviyesi</option>
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <ArrowUpDown className="inline h-4 w-4 mr-1" />
                Sıralama
              </label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                >
                  <option value="created_at">Tarih</option>
                  <option value="title">İsim</option>
                  <option value="average_rating">Puan</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title={sortOrder === 'asc' ? 'Azalan' : 'Artan'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                  setSortBy('created_at');
                  setSortOrder('desc');
                }}
                className="inline-flex items-center gap-2 px-4 py-3 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200 transition-colors"
              >
                <X className="h-4 w-4" />
                Temizle
              </button>
            </div>
          </div>
        </div>
        
        {/* Kurslar Grid */}
        {filteredAndSortedCourses.length === 0 ? (
          <div className="text-center p-12 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-indigo-100">
            <div className="p-6 bg-indigo-50 rounded-full mx-auto w-24 h-24 flex items-center justify-center mb-6">
              <Search className="h-12 w-12 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Hiç kurs bulunamadı</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchQuery || filterStatus !== 'all' 
                ? 'Arama kriterlerinize uygun kurs bulunamadı. Filtreleri değiştirmeyi deneyin.'
                : 'Henüz hiç kurs bulunmuyor.'}
            </p>
            {(searchQuery || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedCourses.map(course => (
              <div 
                key={course.id} 
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-indigo-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="relative h-48 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">
                      {course.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Rating Badge */}
                  {course.average_rating && course.average_rating > 0 && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-xs font-medium text-gray-800">
                        {course.average_rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                  
                  {/* Level Badge */}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                    <span className="text-xs font-medium text-gray-800">
                      {translateLevelToTurkish(course.level)}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
                    {course.title}
                  </h2>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600 text-sm">
                      <User className="h-4 w-4 mr-2 text-indigo-400" />
                      <span>{course.instructor_name}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 text-sm">
                      <Tag className="h-4 w-4 mr-2 text-indigo-400" />
                      <span>{course.category}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 text-sm">
                      <DollarSign className="h-4 w-4 mr-2 text-indigo-400" />
                      <span className="font-semibold text-gray-800">{course.price} TL</span>
                    </div>
                  </div>
                  
                  <Link
                    href={`/student/courses/${course.id}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Kursu İncele</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 