'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { assignmentsApi, Assignment } from '@/lib/api/assignments';
import { useAuth } from '@/hooks/useAuth';

export default function AssignmentsPage() {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const allAssignments = await assignmentsApi.getCourseAssignments(Number(courseId));
      // Sadece bu derse ait ödevleri filtrele
      const lessonAssignments = allAssignments.filter(
        assignment => assignment.lesson_id === Number(lessonId)
      );
      setAssignments(lessonAssignments);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError('Ödevler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Ödevi silme fonksiyonu
  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm('Bu ödevi silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      setDeleting(assignmentId);
      await assignmentsApi.deleteAssignment(Number(courseId), assignmentId);
      toast.success('Ödev başarıyla silindi');
      // Ödevleri yeniden yükle
      fetchAssignments();
    } catch (err) {
      console.error('Error deleting assignment:', err);
      toast.error('Ödev silinirken bir hata oluştu');
    } finally {
      setDeleting(null);
    }
  };

  // Tarih formatını düzenleyen yardımcı fonksiyon
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Teslim tarihi geçmiş mi kontrolü
  const isPastDue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  // Son teslim tarihi yaklaşıyor mu?
  const isCloseToDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days <= 3 && days > 0; // 3 gün veya daha az kalmış
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
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