'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { assignmentsApi, Assignment } from '@/lib/api/assignments';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ArrowLeft, ClipboardList, Clock, Award, AlertTriangle, Trash2 } from 'lucide-react';

export default function AssignmentsPage() {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, [courseId, lessonId]);

  async function fetchAssignments() {
    try {
      setLoading(true);
      const data = await assignmentsApi.getLessonAssignments(
        Number(courseId),
        Number(lessonId)
      );
      setAssignments(data);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError('Ödevler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  // Ödevi silme fonksiyonu (instructor için)
  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm('Bu ödevi silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      setDeleting(assignmentId);
      await assignmentsApi.deleteAssignment(
        Number(courseId),
        Number(lessonId),
        assignmentId
      );
      toast.success('Ödev başarıyla silindi');
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
    return days <= 3 && days > 0;
  };

  if (loading) {
    return <LoadingSpinner size="large" fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="font-semibold text-lg">Hata Oluştu</h3>
            </div>
            <p className="mb-4">{error}</p>
            <Link 
              href={`/student/courses/${courseId}/lessons/${lessonId}`} 
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Derse Geri Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-indigo-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href={`/student/courses/${courseId}/lessons/${lessonId}`}
                  className="p-2 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-indigo-600" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Ödevler
                  </h1>
                  <p className="text-gray-600 mt-1">Bu dersin ödevlerini görüntüleyin</p>
                </div>
              </div>
              <ClipboardList className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-indigo-100 p-12 text-center">
            <ClipboardList className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Henüz Ödev Yok</h3>
            <p className="text-gray-600 mb-6">Bu ders için henüz ödev eklenmemiş.</p>
            <Link 
              href={`/student/courses/${courseId}/lessons/${lessonId}`} 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Derse Geri Dön
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {assignments.map(assignment => (
              <div key={assignment.id} className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-indigo-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{assignment.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Son Tarih: {formatDate(assignment.due_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        <span>Maksimum Puan: {assignment.max_points}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isPastDue(assignment.due_date) 
                        ? 'bg-red-100 text-red-700 border border-red-200' 
                        : isCloseToDue(assignment.due_date) 
                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' 
                          : 'bg-green-100 text-green-700 border border-green-200'
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
                        className="p-2 text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                        title="Ödevi Sil"
                      >
                        {deleting === assignment.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">
                    {assignment.description.length > 200 
                      ? `${assignment.description.substring(0, 200)}...` 
                      : assignment.description}
                  </p>
                </div>
                
                <div className="flex gap-3 flex-wrap">
                  {user?.role === 'student' ? (
                    <>
                      <Link 
                        href={`/student/courses/${courseId}/lessons/${lessonId}/assignment/${assignment.id}/submit`}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          isPastDue(assignment.due_date)
                            ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:-translate-y-0.5'
                        }`}
                        onClick={(e) => {
                          if (isPastDue(assignment.due_date)) {
                            e.preventDefault();
                            toast.error('Bu ödevin son teslim tarihi geçmiştir.');
                          }
                        }}
                      >
                        <ClipboardList className="h-4 w-4" />
                        {isPastDue(assignment.due_date) ? 'Süre Doldu' : 'Ödevi Gönder'}
                      </Link>
                      
                      <Link 
                        href={`/student/courses/${courseId}/lessons/${lessonId}/assignment/${assignment.id}/my-submission`}
                        className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Award className="h-4 w-4" />
                        Sonucu Gör
                      </Link>
                    </>
                  ) : (
                    <Link 
                      href={`/student/courses/${courseId}/lessons/${lessonId}/assignment/${assignment.id}/submissions`}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
                    >
                      <ClipboardList className="h-4 w-4" />
                      Gönderileri Görüntüle
                    </Link>
                  )}
                  

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 