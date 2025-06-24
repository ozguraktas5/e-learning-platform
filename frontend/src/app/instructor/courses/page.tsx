'use client';

import { useState, useEffect } from 'react';  // Client-side rendering için directive
import { coursesApi, Course } from '@/lib/api/courses';  // coursesApi hook'u içe aktar
import { toast } from 'react-hot-toast';  // toast hook'u içe aktar
import Link from 'next/link';  // Link için
import api from '@/lib/api';  // api hook'u içe aktar

interface InstructorCourse extends Course {  // InstructorCourse interface'i
  student_count: number;
  average_rating?: number; 
  completion_rate?: number;
  revenue?: number;
  last_updated?: string;
  published?: boolean;
}

// HTML taglarını temizleme fonksiyonu
const stripHtmlTags = (html: string) => {  // stripHtmlTags fonksiyonu
  const tmp = document.createElement('div');  // tmp objesini oluştur
  tmp.innerHTML = html;  // tmp objesine html ekleye
  return tmp.textContent || tmp.innerText || '';  // tmp objesinin textContent veya innerText'ini dön
};

export default function InstructorCoursesPage() {  // InstructorCoursesPage componenti
  const [courses, setCourses] = useState<InstructorCourse[]>([]);  // courses state'ini kontrol et
  const [loading, setLoading] = useState(true);  // loading state'ini kontrol et
  const [error, setError] = useState<string | null>(null);  // error state'ini kontrol et
  const [sortBy, setSortBy] = useState<string>('created_at');  // sortBy state'ini kontrol et
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');  // sortOrder state'ini kontrol et
  const [filterStatus, setFilterStatus] = useState<string>('all');  // filterStatus state'ini kontrol et
  const [searchQuery, setSearchQuery] = useState<string>('');  // searchQuery state'ini kontrol et

  useEffect(() => {  // useEffect hook'u ile component mount edildiğinde veya dependency değiştiğinde çalışır
    async function fetchCourses() {  // fetchCourses fonksiyonu
      try {  // Try bloğu
        setLoading(true);  // loading state'ini true yap
        
        // Tüm kursları al
        const allCourses = await coursesApi.getAllCourses();
        
        // Her kurs için detayları al
        const detailedCourses = await Promise.all(
          allCourses.map(async (course) => {
            try {
              // Kurs değerlendirmelerini al
              const reviewsResponse = await api.get(`/courses/${course.id}/reviews`);  // api hook'u içe aktar
              const reviewsData = reviewsResponse.data;  // reviewsResponse objesinin data'sını al
              
              // Kayıt verileri doğrudan bir endpoint aracılığıyla alınamaz, bu yüzden varsayılan değerler kullanılır
              const enrollmentData = {
                total_students: 0,
                average_completion: 0
              };
              
              return {
                ...course,  // course objesini dön
                student_count: enrollmentData?.total_students || 0, 
                average_rating: reviewsData?.average_rating || 0,
                completion_rate: enrollmentData?.average_completion || 0,
                revenue: 0,
                last_updated: course.updated_at || course.created_at,
                published: true
              };
            } catch (err) {
              console.error(`Error fetching details for course ${course.id}:`, err);  // Hata mesajını konsola yazdır
              return {
                ...course,  // course objesini dön
                student_count: 0, 
                average_rating: 0, 
                completion_rate: 0,
                revenue: 0,
                last_updated: course.updated_at || course.created_at,
                published: true
              };
            }
          })
        );
        
        setCourses(detailedCourses);  // detailedCourses objesini set et 
      } catch (err) {  // Hata durumunda
        console.error('Error fetching courses:', err);  // Hata mesajını konsola yazdır
        setError('Kurslar yüklenirken bir hata oluştu.');  // error state'ini set et
        toast.error('Kurslar yüklenirken bir hata oluştu.');  // Hata mesajını göster
      } finally {  // Finally bloğu
        setLoading(false);  // loading state'ini false yap
      }
    }  // fetchCourses fonksiyonunu çağır
    
    fetchCourses();  // fetchCourses fonksiyonunu çağır

    // Sayfaya her gelindiğinde kursları yeniden yükle
    const handleRouteChange = () => {  // handleRouteChange fonksiyonu
      fetchCourses();  // fetchCourses fonksiyonunu çağır
    };  // handleRouteChange fonksiyonunu çağır
    
    window.addEventListener('focus', handleRouteChange);  // window objesine focus event'i ekle
    
    return () => {  // return bloğu
      window.removeEventListener('focus', handleRouteChange);  // window objesine focus event'i kaldır
    };  // return bloğu
  }, []);  // useEffect hook'u ile component mount edildiğinde veya dependency değiştiğinde çalışır

  // Sıralama işlevi
  const sortCourses = (a: InstructorCourse, b: InstructorCourse) => {  // sortCourses fonksiyonu
    if (sortBy === 'title') {  // sortBy 'title' ise
      return sortOrder === 'asc'  // sortOrder 'asc' ise
        ? a.title.localeCompare(b.title)  // a.title'ı b.title'a göre sırala
        : b.title.localeCompare(a.title);  // b.title'ı a.title'a göre sırala
    } else if (sortBy === 'student_count') {  // sortBy 'student_count' ise
      return sortOrder === 'asc'  // sortOrder 'asc' ise
        ? a.student_count - b.student_count  // a.student_count'ı b.student_count'a göre sırala
        : b.student_count - a.student_count;  // b.student_count'ı a.student_count'a göre sırala
    } else if (sortBy === 'average_rating') {  // sortBy 'average_rating' ise
      const aRating = a.average_rating || 0;  // a.average_rating'ı 0'a eşitle
      const bRating = b.average_rating || 0;  // b.average_rating'ı 0'a eşitle
      return sortOrder === 'asc'  // sortOrder 'asc' ise
        ? aRating - bRating  // aRating'ı bRating'a göre sırala
        : bRating - aRating;  // bRating'ı aRating'a göre sırala
    } else if (sortBy === 'revenue') {  // sortBy 'revenue' ise
      const aRevenue = a.revenue || 0;  // a.revenue'ı 0'a eşitle
      const bRevenue = b.revenue || 0;  // b.revenue'ı 0'a eşitle
      return sortOrder === 'asc'  // sortOrder 'asc' ise
        ? aRevenue - bRevenue  // aRevenue'ı bRevenue'a göre sırala
        : bRevenue - aRevenue;  // bRevenue'ı aRevenue'a göre sırala
    } else if (sortBy === 'last_updated') {  // sortBy 'last_updated' ise
      const aDate = new Date(a.last_updated || a.updated_at || a.created_at).getTime();  // a.last_updated'ı a.updated_at veya a.created_at'a göre sırala
      const bDate = new Date(b.last_updated || b.updated_at || b.created_at).getTime();  // b.last_updated'ı b.updated_at veya b.created_at'a göre sırala
      return sortOrder === 'asc'  // sortOrder 'asc' ise
        ? aDate - bDate  // aDate'ı bDate'a göre sırala
        : bDate - aDate;  // bDate'ı aDate'a göre sırala
    }
    
    // Varsayılan sıralama: oluşturma tarihine göre
    const aDate = new Date(a.created_at).getTime();  // a.created_at'ı getTime() ile sırala 
    const bDate = new Date(b.created_at).getTime();  // b.created_at'ı getTime() ile sırala
    return sortOrder === 'asc'  // sortOrder 'asc' ise
      ? aDate - bDate  // aDate'ı bDate'a göre sırala
      : bDate - aDate;  // bDate'ı aDate'a göre sırala
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
    const date = new Date(dateString);  // dateString'i Date objesine çevir
    return new Intl.DateTimeFormat('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    }).format(date);  // date objesini formatla
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
        <h1 className="text-3xl font-bold">Kurslarım</h1>
        <Link
          href="/instructor/courses/create"
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
                  <th className="py-3 px-4 text-center">{renderSortableHeader('Değerlendirme', 'average_rating')}</th>
                  <th className="py-3 px-4 text-center">{renderSortableHeader('Tamamlanma', 'completion_rate')}</th>
                  <th className="py-3 px-4 text-center">{renderSortableHeader('Son Güncellenme', 'last_updated')}</th>
                  <th className="py-3 px-4 text-center">Durum</th>
                  <th className="py-3 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAndSortedCourses.map(course => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link href={`/instructor/courses/${course.id}`} className="text-blue-600 hover:underline font-medium">
                        {course.title}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">{stripHtmlTags(course.description)}</p>
                    </td>
                    <td className="py-3 px-4 text-center">{course.student_count}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <span>{course.average_rating?.toFixed(1) || 'N/A'}</span>
                        {course.average_rating && course.average_rating > 0 && <span className="text-yellow-500 ml-1">★</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
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
                    <td className="py-3 px-4 text-center text-sm text-gray-500">
                      {formatDate(course.last_updated || course.updated_at || course.created_at)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        course.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {course.published ? 'Yayında' : 'Taslak'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Link 
                          href={`/instructor/courses/${course.id}/edit`}
                          className="p-1 text-gray-500 hover:text-blue-600"
                          title="Düzenle"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </Link>
                        <Link 
                          href={`/instructor/courses/${course.id}`}
                          className="p-1 text-gray-500 hover:text-green-600"
                          title="Görüntüle"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
    </div>
  );
} 