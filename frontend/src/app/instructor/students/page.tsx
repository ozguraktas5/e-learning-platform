'use client';

import { useState, useEffect } from 'react';
import { instructorsApi, StudentEnrollment, StudentStats } from '@/lib/api/instructors';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function InstructorStudentsPage() {
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<keyof StudentEnrollment>('enrolled_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [coursesFilter, setCoursesFilter] = useState<{id: number, title: string}[]>([]);

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true);
        const fetchedStudents = await instructorsApi.getEnrolledStudents();
        const fetchedStats = await instructorsApi.getStudentStats();
        
        setStudents(fetchedStudents);
        setStats(fetchedStats);
        
        // Extract unique courses for filtering
        const uniqueCourses = [...new Map(
          fetchedStudents.map(item => [item.course.id, item.course])
        ).values()];
        setCoursesFilter(uniqueCourses);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Öğrenciler yüklenirken bir hata oluştu.');
        toast.error('Öğrenciler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchStudents();
  }, []);

  // Sorting function
  const sortStudents = (a: StudentEnrollment, b: StudentEnrollment) => {
    if (sortBy === 'enrolled_at') {
      return sortOrder === 'asc'
        ? new Date(a.enrolled_at).getTime() - new Date(b.enrolled_at).getTime()
        : new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime();
    } else if (sortBy === 'last_activity_at') {
      return sortOrder === 'asc'
        ? new Date(a.last_activity_at).getTime() - new Date(b.last_activity_at).getTime()
        : new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime();
    } else if (sortBy === 'progress') {
      return sortOrder === 'asc'
        ? a.progress - b.progress
        : b.progress - a.progress;
    } 
    
    // Default case - by student name
    return sortOrder === 'asc'
      ? a.student.name.localeCompare(b.student.name)
      : b.student.name.localeCompare(a.student.name);
  };

  // Filtering function
  const filterStudents = (student: StudentEnrollment) => {
    // First filter by search query (name or email)
    if (searchQuery && 
        !student.student.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !student.student.email.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Then filter by selected course
    if (selectedCourse !== null && student.course.id !== selectedCourse) {
      return false;
    }
    
    // Then filter by status
    if (filterStatus === 'all') {
      return true;
    } else if (filterStatus === 'completed') {
      return student.completed;
    } else if (filterStatus === 'in-progress') {
      return !student.completed && student.progress > 0;
    } else if (filterStatus === 'not-started') {
      return student.progress === 0;
    } else if (filterStatus === 'active') {
      const lastActivity = new Date(student.last_activity_at);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      return lastActivity > twoWeeksAgo;
    }
    
    return true;
  };

  // Date formatting utilities
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Bugün';
    } else if (diffDays === 1) {
      return 'Dün';
    } else if (diffDays < 7) {
      return `${diffDays} gün önce`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} hafta önce`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ay önce`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} yıl önce`;
    }
  };

  // Header for sortable columns
  const renderSortableHeader = (label: string, key: keyof StudentEnrollment) => {
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

  const filteredAndSortedStudents = students
    .filter(filterStudents)
    .sort(sortStudents);

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold">Öğrencilerim</h1>
        <div className="mt-4 md:mt-0">
          <Link
            href="/instructor/dashboard"
            className="text-blue-600 hover:text-blue-800 mr-4"
          >
            Özet İstatistikler
          </Link>
          <Link
            href="/instructor/courses"
            className="text-blue-600 hover:text-blue-800"
          >
            Kurslarım
          </Link>
        </div>
      </div>

      {/* Öğrenci İstatistikleri */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-400">Toplam Öğrenci</h3>
                <p className="text-2xl font-bold">{stats.total_students}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-400">Aktif Öğrenci</h3>
                <p className="text-2xl font-bold">{stats.active_students}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-amber-100 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-400">Bu Ay Tamamlanan</h3>
                <p className="text-2xl font-bold">{stats.completions_this_month}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-purple-100 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-400">Ort. Tamamlanma</h3>
                <p className="text-2xl font-bold">{stats.average_course_completion}%</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Filtreleme ve Arama */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Ara</label>
            <input
              type="text"
              id="search"
              placeholder="İsim veya e-posta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">Kurs</label>
            <select
              id="course"
              value={selectedCourse !== null ? selectedCourse : ''}
              onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : null)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tüm Kurslar</option>
              {coursesFilter.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
            <select
              id="status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Öğrenciler</option>
              <option value="active">Son 2 Hafta Aktif</option>
              <option value="completed">Tamamlanan</option>
              <option value="in-progress">Devam Eden</option>
              <option value="not-started">Başlamayan</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setSelectedCourse(null);
                setSortBy('enrolled_at');
                setSortOrder('desc');
              }}
              className="w-full px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-600"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>
      
      {/* Öğrenciler Tablosu */}
      {filteredAndSortedStudents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-10 text-center">
          <h3 className="text-xl font-medium text-gray-700">Hiç öğrenci bulunamadı</h3>
          <p className="mt-2 text-gray-500">
            {searchQuery || filterStatus !== 'all' || selectedCourse !== null
              ? 'Arama kriterlerinize uygun öğrenci bulunamadı. Filtreleri değiştirmeyi deneyin.'
              : 'Henüz hiç öğrenciniz bulunmuyor.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-gray-700 text-sm">
                <tr>
                  <th className="py-3 px-4 text-left">Öğrenci</th>
                  <th className="py-3 px-4 text-left">Kurs</th>
                  <th className="py-3 px-4 text-center">{renderSortableHeader('Kayıt Tarihi', 'enrolled_at')}</th>
                  <th className="py-3 px-4 text-center">{renderSortableHeader('İlerleme', 'progress')}</th>
                  <th className="py-3 px-4 text-center">{renderSortableHeader('Son Aktivite', 'last_activity_at')}</th>
                  <th className="py-3 px-4 text-center">Durum</th>
                  <th className="py-3 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAndSortedStudents.map(enrollment => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
                          {enrollment.student.avatar ? (
                            <img 
                              src={enrollment.student.avatar} 
                              alt={enrollment.student.name} 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center', 'bg-blue-100', 'text-blue-500');
                                e.currentTarget.parentElement!.innerHTML = `<span>${enrollment.student.name.charAt(0)}</span>`;
                              }} 
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500">
                              <span>{enrollment.student.name.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{enrollment.student.name}</div>
                          <div className="text-sm text-gray-500">{enrollment.student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Link 
                        href={`/instructor/courses/${enrollment.course.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {enrollment.course.title}
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-center text-sm text-gray-500">
                      <div>{formatDate(enrollment.enrolled_at)}</div>
                      <div className="text-xs">{formatTimeAgo(enrollment.enrolled_at)}</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            enrollment.progress === 100 ? 'bg-green-600' : 
                            enrollment.progress > 75 ? 'bg-blue-600' :
                            enrollment.progress > 25 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${enrollment.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {enrollment.progress}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-sm text-gray-500">
                      <div>{formatTimeAgo(enrollment.last_activity_at)}</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {enrollment.completed ? (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          Tamamlandı
                        </span>
                      ) : enrollment.progress > 0 ? (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          Devam Ediyor
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          Başlamadı
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/instructor/students/${enrollment.student.id}/message`}
                          title="Mesaj Gönder"
                          className="p-1 text-gray-500 hover:text-blue-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/instructor/students/${enrollment.student.id}/progress`}
                          title="İlerleme Detayları"
                          className="p-1 text-gray-500 hover:text-green-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
      
      {filteredAndSortedStudents.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Toplam {filteredAndSortedStudents.length} öğrenci gösteriliyor
        </div>
      )}
    </div>
  );
} 