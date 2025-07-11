'use client';

import { useState, useEffect, useCallback } from 'react';  // Client-side rendering için directive
import { useParams } from 'next/navigation';  // Route parametrelerini almak için
import Link from 'next/link';  // Link componenti için
import { toast } from 'react-hot-toast';  // Toast mesajları için
import { assignmentsApi, Assignment } from '@/lib/api/assignments';  // Assignment API'sini içe aktar
import { useAuth } from '@/contexts/AuthContext';  // useAuth hook'unu içe aktar

export default function AssignmentsPage() {  // AssignmentsPage componenti
  const { courseId, lessonId } = useParams();  // Route parametrelerini al
  const { user } = useAuth();  // useAuth hook'unu çağır
  const [assignments, setAssignments] = useState<Assignment[]>([]);  // Assignments state'ini tut
  const [loading, setLoading] = useState(true);  // Loading durumunu kontrol et
  const [error, setError] = useState<string | null>(null);  // Hata durumunu kontrol et
  const [deleting, setDeleting] = useState<number | null>(null);  // Deleting state'ini tut

  const fetchAssignments = useCallback(async () => {  // fetchAssignments fonksiyonu
    try {
      setLoading(true);  // Loading durumunu true yap
      const allAssignments = await assignmentsApi.getCourseAssignments(Number(courseId));  // Tüm ödevleri al
      // Sadece bu derse ait ödevleri filtrele
      const lessonAssignments = allAssignments.filter(  // Sadece bu derse ait ödevleri filtrele
        assignment => assignment.lesson_id === Number(lessonId)
      );
      setAssignments(lessonAssignments);  // Assignments state'ini güncelle
    } catch (err) {  // Hata durumunda
      console.error('Error fetching assignments:', err);  // Hata mesajını konsola yazdır
      setError('Ödevler yüklenirken bir hata oluştu.');  // Hata mesajını göster
    } finally {
      setLoading(false);  // Loading durumunu false yap
    }
  }, [courseId, lessonId]);

  useEffect(() => {  // useEffect hook'u ile component mount edildiğinde veya dependency değiştiğinde çalışır
    fetchAssignments();  // fetchAssignments fonksiyonunu çağır
  }, [fetchAssignments]); 

  // Ödevi silme fonksiyonu
  const handleDeleteAssignment = async (assignmentId: number) => {  // handleDeleteAssignment fonksiyonu
    if (!confirm('Bu ödevi silmek istediğinize emin misiniz?')) {  // Ödevi silmek istediğinize emin misiniz?
      return;  // Fonksiyonu sonlandır
    }

    try {
      setDeleting(assignmentId);  // Deleting state'ini güncelle
      await assignmentsApi.deleteAssignment(Number(courseId), assignmentId);  // Ödevi sil
      toast.success('Ödev başarıyla silindi');  // Toast mesajı göster
      // Ödevleri yeniden yükle
      fetchAssignments();  // Ödevleri yeniden yükle
    } catch (err) {  // Hata durumunda
      console.error('Error deleting assignment:', err);  // Hata mesajını konsola yazdır
      toast.error('Ödev silinirken bir hata oluştu');  // Toast mesajı göster
    } finally {
      setDeleting(null);  // Deleting state'ini null yap
    }
  };

  // Tarih formatını düzenleyen yardımcı fonksiyon
  const formatDate = (dateString: string) => {  // formatDate fonksiyonu
    const date = new Date(dateString);  // Tarihi al
    return new Intl.DateTimeFormat('tr-TR', {  // Tarihi formatla
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Teslim tarihi geçmiş mi kontrolü
  const isPastDue = (dueDate: string) => {  // isPastDue fonksiyonu
    return new Date(dueDate) < new Date();  // Teslim tarihi geçmiş mi
  };

  // Son teslim tarihi yaklaşıyor mu?
  const isCloseToDue = (dueDate: string) => {  // isCloseToDue fonksiyonu
    const due = new Date(dueDate);  // Teslim tarihi al
    const now = new Date();  // Şu anki tarihi al
    const diff = due.getTime() - now.getTime();  // Teslim tarihi ile şu anki tarih arasındaki farkı al
    const days = diff / (1000 * 60 * 60 * 24);  // Gün cinsinden farkı al
    return days <= 3 && days > 0;  // 3 gün veya daha az kalmış mı
  };

  if (loading) {  // Loading durumunda
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {  // Hata durumunda
    return (
      <div className="p-6">
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          <h3 className="font-medium">Hata</h3>
          <p className="mt-2">{error}</p>
          <Link href={`/instructor/courses/${courseId}/lessons/${lessonId}`} className="mt-4 block text-blue-600 hover:underline">
            Derse geri dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ödevler</h1>
        
        {user?.role === 'instructor' && (
          <Link
            href={`/instructor/courses/${courseId}/lessons/${lessonId}/assignment/create`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Yeni Ödev Oluştur
          </Link>
        )}
      </div>

      {assignments.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-600">Bu ders için henüz ödev bulunmamaktadır.</p>
          <Link href={`/instructor/courses/${courseId}/lessons/${lessonId}`} className="mt-4 inline-block text-blue-600 hover:underline">
            Derse geri dön
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {assignments.map(assignment => (
            <div key={assignment.id} className="border rounded-lg p-4 shadow-sm bg-white">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold">{assignment.title}</h2>
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isPastDue(assignment.due_date) 
                      ? 'bg-red-100 text-red-800' 
                      : isCloseToDue(assignment.due_date) 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                  }`}>
                    {isPastDue(assignment.due_date) 
                      ? 'Süresi Dolmuş' 
                      : isCloseToDue(assignment.due_date) 
                        ? 'Son Tarih Yaklaşıyor' 
                        : 'Aktif'}
                  </div>
                  {user?.role === 'instructor' && (
                    <button
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      disabled={deleting === assignment.id}
                      className="text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 p-1 rounded-full"
                      title="Ödevi Sil"
                    >
                      {deleting === assignment.id ? (
                        <span className="inline-block w-5 h-5 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-2 text-gray-600">
                <p>Teslim Tarihi: {formatDate(assignment.due_date)}</p>
                <p>Maksimum Puan: {assignment.max_points}</p>
                {user?.role === 'instructor' && (
                  <p>Gönderim Sayısı: {assignment.submission_count || 0}</p>
                )}
              </div>
              
              <div className="mt-4">
                {assignment.description.length > 150 
                  ? `${assignment.description.substring(0, 150)}...` 
                  : assignment.description}
              </div>
              
              <div className="mt-4 flex gap-2">
                {user?.role === 'student' ? (
                  <>
                    <Link 
                      href={`/courses/${courseId}/lessons/${lessonId}/assignment/${assignment.id}/submit`}
                      className={`px-4 py-2 rounded-md ${
                        isPastDue(assignment.due_date)
                          ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                      onClick={(e) => {
                        if (isPastDue(assignment.due_date)) {
                          e.preventDefault();
                          toast.error('Bu ödevin son teslim tarihi geçmiştir.');
                        }
                      }}
                    >
                      {isPastDue(assignment.due_date) ? 'Süre Doldu' : 'Ödevi Gönder'}
                    </Link>
                    
                    <Link 
                      href={`/courses/${courseId}/lessons/${lessonId}/assignment/${assignment.id}/my-submission`}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Sonucu Gör
                    </Link>
                  </>
                ) : (
                  <Link 
                    href={`/instructor/courses/${courseId}/lessons/${lessonId}/assignment/${assignment.id}/submissions`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Gönderileri Görüntüle
                  </Link>
                )}
                
                <Link 
                  href={`/instructor/courses/${courseId}/lessons/${lessonId}`}
                  className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
                >
                  Derse Dön
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 