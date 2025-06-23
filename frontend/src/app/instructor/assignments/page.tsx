'use client';

import { useState, useEffect } from 'react';  // React'ten useState ve useEffect'i içe aktarır.
import { assignmentsApi, Assignment, AssignmentStats } from '@/lib/api/assignments';  // assignmentsApi, Assignment ve AssignmentStats'u içe aktarır.
import { toast } from 'react-hot-toast';  // react-hot-toast'tan toast'u içe aktarır.
import Link from 'next/link';  // Next.js'ten Link'i içe aktarır.
import { format, isAfter } from 'date-fns';  // date-fns'ten format ve isAfter'ı içe aktarır.

export default function InstructorAssignmentsPage() {  // InstructorAssignmentsPage bileşenini dışa aktarır.
  const [assignments, setAssignments] = useState<Assignment[]>([]);  // assignments değişkenini oluşturur ve Assignment tipinde bir dizi ile başlatır.
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);  // filteredAssignments değişkenini oluşturur ve Assignment tipinde bir dizi ile başlatır.
  const [stats, setStats] = useState<AssignmentStats | null>(null);  // stats değişkenini oluşturur ve AssignmentStats tipinde bir değişken ile başlatır.
  const [loading, setLoading] = useState(true);  // loading değişkenini oluşturur ve true ile başlatır.
  const [error, setError] = useState<string | null>(null);  // error değişkenini oluşturur ve string tipinde bir değişken ile başlatır.
  const [searchQuery, setSearchQuery] = useState<string>('');  // searchQuery değişkenini oluşturur ve string tipinde bir değişken ile başlatır.
  const [statusFilter, setStatusFilter] = useState<string>('all');  // statusFilter değişkenini oluşturur ve string tipinde bir değişken ile başlatır.
  const [sortBy, setSortBy] = useState<keyof Assignment>('due_date');  // sortBy değişkenini oluşturur ve Assignment tipinde bir değişken ile başlatır.
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');  // sortOrder değişkenini oluşturur ve 'asc' veya 'desc' tipinde bir değişken ile başlatır.

  useEffect(() => {  // useEffect fonksiyonunu oluşturur.
    async function fetchAssignments() {  // fetchAssignments fonksiyonunu oluşturur.
      try {  // try bloğunu oluşturur.
        setLoading(true);  // setLoading fonksiyonunu çağırır ve true ile başlatır.
        const [fetchedAssignments, fetchedStats] = await Promise.all([  // Promise.all fonksiyonunu çağırır ve assignmentsApi'den getInstructorAssignments ve getAssignmentStats fonksiyonlarını çağırır.
          assignmentsApi.getInstructorAssignments(),  // assignmentsApi'den getInstructorAssignments fonksiyonunu çağırır.
          assignmentsApi.getAssignmentStats()  // assignmentsApi'den getAssignmentStats fonksiyonunu çağırır.
        ]);
        
        setAssignments(fetchedAssignments);  // setAssignments fonksiyonunu çağırır ve fetchedAssignments değişkenini parametre olarak alır.
        setFilteredAssignments(fetchedAssignments);  // setFilteredAssignments fonksiyonunu çağırır ve fetchedAssignments değişkenini parametre olarak alır.
        setStats(fetchedStats);  // setStats fonksiyonunu çağırır ve fetchedStats değişkenini parametre olarak alır.
      } catch (err) {  // catch bloğunu oluşturur.
        console.error('Error fetching assignments:', err);  // console.error fonksiyonunu çağırır ve 'Error fetching assignments:' ile birlikte err'i yazdırır.
        setError('Ödevler yüklenirken bir hata oluştu.');  // setError fonksiyonunu çağırır ve 'Ödevler yüklenirken bir hata oluştu.' ile başlatır.
        toast.error('Ödevler yüklenirken bir hata oluştu.');  // toast.error fonksiyonunu çağırır ve 'Ödevler yüklenirken bir hata oluştu.' ile başlatır.
      } finally {  // finally bloğunu oluşturur.
        setLoading(false);  // setLoading fonksiyonunu çağırır ve false ile başlatır.
      }
    }
    
    fetchAssignments();  // fetchAssignments fonksiyonunu çağırır.
  }, []);  // useEffect fonksiyonunu çağırır.
  
  // Ödevleri filtreleme
  useEffect(() => {
    const filtered = assignments.filter(assignment => { 
      // Arama sorgusuna göre filtreleme
      const matchesSearch = 
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||  // assignment.title değişkeni searchQuery değişkeninin küçük harfe çevrilmiş hali ile içeriyorsa
        assignment.course_title.toLowerCase().includes(searchQuery.toLowerCase());  // assignment.course_title değişkeni searchQuery değişkeninin küçük harfe çevrilmiş hali ile içeriyorsa
      
      // Duruma göre filtreleme
      let matchesStatus = true;  // matchesStatus değişkenini oluşturur ve true ile başlatır.
      if (statusFilter !== 'all') {  // statusFilter değişkeni 'all' değilse
        if (statusFilter === 'active') {  // statusFilter değişkeni 'active' ise
          matchesStatus = assignment.status === 'active';  // assignment.status değişkeni 'active' ise
        } else if (statusFilter === 'expired') {  // statusFilter değişkeni 'expired' ise
          matchesStatus = assignment.status === 'expired';  // assignment.status değişkeni 'expired' ise
        } else if (statusFilter === 'draft') {  // statusFilter değişkeni 'draft' ise
          matchesStatus = assignment.status === 'draft';  // assignment.status değişkeni 'draft' ise
        } else if (statusFilter === 'needs_review') {  // statusFilter değişkeni 'needs_review' ise
          matchesStatus = 
            assignment.submissions_count > assignment.graded_count &&  // assignment.submissions_count değişkeni assignment.graded_count değişkeninden büyükse
            assignment.status !== 'draft';  // assignment.status değişkeni 'draft' değilse
        }
      }
      
      return matchesSearch && matchesStatus;  // matchesSearch ve matchesStatus değişkenleri true ise
    });
    
    // Sıralama uygulama
    const sortedAssignments = [...filtered].sort((a, b) => {
      if (sortBy === 'due_date') {  // sortBy değişkeni 'due_date' ise
        return sortOrder === 'asc'  // sortOrder değişkeni 'asc' ise
          ? new Date(a.due_date).getTime() - new Date(b.due_date).getTime()  // new Date(a.due_date).getTime() - new Date(b.due_date).getTime() ile a.due_date ve b.due_date arasındaki farkı hesaplar.
          : new Date(b.due_date).getTime() - new Date(a.due_date).getTime();  // new Date(b.due_date).getTime() - new Date(a.due_date).getTime() ile b.due_date ve a.due_date arasındaki farkı hesaplar.
      } else if (sortBy === 'created_at') {  // sortBy değişkeni 'created_at' ise
        return sortOrder === 'asc'  // sortOrder değişkeni 'asc' ise
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()  // new Date(a.created_at).getTime() - new Date(b.created_at).getTime() ile a.created_at ve b.created_at arasındaki farkı hesaplar.
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();  // new Date(b.created_at).getTime() - new Date(a.created_at).getTime() ile b.created_at ve a.created_at arasındaki farkı hesaplar.
      } else if (sortBy === 'title') {  // sortBy değişkeni 'title' ise
        return sortOrder === 'asc'  // sortOrder değişkeni 'asc' ise
          ? a.title.localeCompare(b.title)  // a.title.localeCompare(b.title) ile a.title ve b.title arasındaki farkı hesaplar.
          : b.title.localeCompare(a.title);  // b.title.localeCompare(a.title) ile b.title ve a.title arasındaki farkı hesaplar.
      } else if (sortBy === 'course_title') {  // sortBy değişkeni 'course_title' ise
        return sortOrder === 'asc'  // sortOrder değişkeni 'asc' ise
          ? a.course_title.localeCompare(b.course_title)  // a.course_title.localeCompare(b.course_title) ile a.course_title ve b.course_title arasındaki farkı hesaplar.
          : b.course_title.localeCompare(a.course_title);  // b.course_title.localeCompare(a.course_title) ile b.course_title ve a.course_title arasındaki farkı hesaplar.
      } else if (sortBy === 'submissions_count') {  // sortBy değişkeni 'submissions_count' ise
        return sortOrder === 'asc'  // sortOrder değişkeni 'asc' ise
          ? a.submissions_count - b.submissions_count  // a.submissions_count - b.submissions_count ile a.submissions_count ve b.submissions_count arasındaki farkı hesaplar.
          : b.submissions_count - a.submissions_count;  // b.submissions_count - a.submissions_count ile b.submissions_count ve a.submissions_count arasındaki farkı hesaplar.
      }
      
      // Varsayılan
      return 0;  // 0 döner.
    });
    
    setFilteredAssignments(sortedAssignments);  // setFilteredAssignments fonksiyonunu çağırır ve sortedAssignments değişkenini parametre olarak alır.
  }, [assignments, searchQuery, statusFilter, sortBy, sortOrder]);  // useEffect fonksiyonunu çağırır.
  
  // Tarihi formatlama
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);  // date değişkenini oluşturur ve dateString'i new Date ile tarihleştirir.
    return format(date, 'dd MMM yyyy');  // format fonksiyonunu çağırır ve date değişkenini 'dd MMM yyyy' formatına çevirir.
  };
  
  // Son tarihi kontrol etme
  const isPastDue = (dateString: string) => {  // isPastDue fonksiyonunu oluşturur ve dateString değişkenini alır.
    const dueDate = new Date(dateString);  // dueDate değişkenini oluşturur ve dateString'i new Date ile tarihleştirir.
    return !isAfter(dueDate, new Date());  // isAfter fonksiyonunu çağırır ve dueDate değişkeni new Date'den büyükse true döner.
  };
  
  // Sütun başlığı ile sıralama düğmesi
  const renderSortableHeader = (label: string, key: keyof Assignment) => {  // renderSortableHeader fonksiyonunu oluşturur ve label ve key değişkenlerini alır.
    const isActive = sortBy === key;  // isActive değişkenini oluşturur ve sortBy değişkeni key değişkenine eşitse true döner.
    
    return (
      <button 
        onClick={() => {
          if (isActive) {  // isActive değişkeni true ise
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');  // setSortOrder fonksiyonunu çağırır ve sortOrder değişkeni 'asc' ise 'desc' yapılır, değilse 'asc' yapılır.
          } else {  // isActive değişkeni false ise
            setSortBy(key);  // setSortBy fonksiyonunu çağırır ve key değişkenini parametre olarak alır.
            setSortOrder('asc');  // setSortOrder fonksiyonunu çağırır ve 'asc' değişkenini parametre olarak alır.
          }
        }}
        className={`flex items-center space-x-1 font-medium ${isActive ? 'text-blue-600' : ''}`}
      >
        <span>{label}</span>
        {isActive && (
          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
        )}
      </button>
    );
  };
  
  if (loading) {  // loading değişkeni true ise
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
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Ödevler</h1>
        <Link 
          href="/instructor/assignments/create" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Yeni Ödev Oluştur
        </Link>
      </div>
      
      {/* İstatistikler */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm uppercase">Toplam Ödev</h3>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm uppercase">Aktif Ödev</h3>
                <p className="text-3xl font-bold">{stats.active}</p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm uppercase">Değerlendirme Bekleyen</h3>
                <p className="text-3xl font-bold">{stats.pending_review}</p>
              </div>
              <div className="rounded-full bg-amber-100 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm uppercase">Ortalama Not</h3>
                <p className="text-3xl font-bold">{stats.average_score}%</p>
              </div>
              <div className="rounded-full bg-indigo-100 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Filtreleme Alanı */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">Arama</label>
            <input
              type="text"
              id="search"
              placeholder="Ödev başlığı veya kurs adı..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Ödevler</option>
              <option value="active">Aktif</option>
              <option value="expired">Süresi Dolmuş</option>
              <option value="draft">Taslak</option>
              <option value="needs_review">Değerlendirme Bekleyen</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setSortBy('due_date');
                setSortOrder('asc');
              }}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-600 w-full"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>
      
      {/* Ödev Listesi */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-10 text-center">
          <h3 className="text-xl font-medium text-gray-700">Hiç ödev bulunamadı</h3>
          <p className="mt-2 text-gray-500">
            {searchQuery || statusFilter !== 'all'
              ? 'Arama kriterlerinize uygun ödev bulunamadı. Filtreleri değiştirmeyi deneyin.'
              : 'Henüz hiç ödev oluşturmadınız. "Yeni Ödev Oluştur" düğmesini kullanarak ilk ödevinizi oluşturabilirsiniz.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-gray-700 text-sm">
                <tr>
                  <th className="py-3 px-4 text-left">{renderSortableHeader('Başlık', 'title')}</th>
                  <th className="py-3 px-4 text-left">{renderSortableHeader('Kurs', 'course_title')}</th>
                  <th className="py-3 px-4 text-center">{renderSortableHeader('Son Tarih', 'due_date')}</th>
                  <th className="py-3 px-4 text-center">Durum</th>
                  <th className="py-3 px-4 text-center">{renderSortableHeader('Teslimler', 'submissions_count')}</th>
                  <th className="py-3 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAssignments.map(assignment => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link href={`/instructor/courses/${assignment.course_id}/lessons/${assignment.lesson_id}/assignment/${assignment.id}`} className="font-medium text-blue-600 hover:underline">
                        {assignment.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/instructor/courses/${assignment.course_id}`} className="text-gray-600 hover:text-blue-600">
                        {assignment.course_title}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-center text-sm">
                      <span className={isPastDue(assignment.due_date) ? 'text-red-600' : 'text-gray-600'}>
                        {formatDate(assignment.due_date)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        assignment.status === 'active' ? 'bg-green-100 text-green-800' :
                        assignment.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.status === 'active' ? 'Aktif' :
                         assignment.status === 'expired' ? 'Süresi Doldu' :
                         'Taslak'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <div className="font-medium">{assignment.submissions_count}</div>
                        <div className="text-xs text-gray-500">{assignment.graded_count} değerlendirildi</div>
                        {assignment.submissions_count > assignment.graded_count && (
                          <span className="text-xs text-amber-600 mt-1">
                            {assignment.submissions_count - assignment.graded_count} bekliyor
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Link 
                          href={`/instructor/courses/${assignment.course_id}/lessons/${assignment.lesson_id}/assignment/${assignment.id}`}
                          className="p-1 text-gray-500 hover:text-blue-600"
                          title="Görüntüle"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </Link>
                        <Link 
                          href={`/instructor/courses/${assignment.course_id}/lessons/${assignment.lesson_id}/assignment/${assignment.id}/edit`}
                          className="p-1 text-gray-500 hover:text-amber-600"
                          title="Düzenle"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </Link>
                        {assignment.submissions_count > assignment.graded_count && (
                          <Link 
                            href={`/instructor/courses/${assignment.course_id}/lessons/${assignment.lesson_id}/assignment/${assignment.id}/submissions`}
                            className="p-1 text-amber-600 hover:text-amber-800"
                            title="Teslimler"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
                            </svg>
                          </Link>
                        )}
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