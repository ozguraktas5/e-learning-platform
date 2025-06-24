'use client';

import { useState, useEffect } from 'react';  // Client-side rendering için directive
import { useParams, useRouter } from 'next/navigation';  // Route parametrelerini almak için
import Link from 'next/link';  // Link componenti için
import { toast } from 'react-hot-toast';  // Toast mesajları için
import { assignmentsApi } from '@/lib/api/assignments';  // Assignment API'sini içe aktar
import LoadingSpinner from '@/components/ui/LoadingSpinner';  // Loading spinner için

interface Assignment {  // Assignment interface'i
  id: number;
  title: string;
  description: string;
  due_date: string;
  max_points: number;
  created_at: string;
  updated_at: string;
  lesson_id: number;
  submission_count?: number;
}

export default function AssignmentDetailsPage() {  // AssignmentDetailsPage componenti
  const { courseId, lessonId, assignmentId } = useParams();  // Route parametrelerini al
  const router = useRouter();  // Router instance'ını al
  const [assignment, setAssignment] = useState<Assignment | null>(null);  // Assignment state'ini tut
  const [loading, setLoading] = useState(true);  // Loading durumunu kontrol et

  const numericCourseId = Number(courseId);  // Course ID'yi al
  const numericLessonId = Number(lessonId);  // Lesson ID'yi al
  const numericAssignmentId = Number(assignmentId);  // Assignment ID'yi al

  useEffect(() => {  // useEffect hook'u ile component mount edildiğinde veya dependency değiştiğinde çalışır
    if (isNaN(numericCourseId) || isNaN(numericLessonId) || isNaN(numericAssignmentId)) {  // Course ID, Lesson ID ve Assignment ID geçerliyse
      toast.error('Geçersiz URL parametreleri');  // Toast mesajı göster
      router.push('/instructor/courses');  // Router'ı güncelle
      return;  // Fonksiyonu sonlandır
    }

    const fetchAssignment = async () => {  // fetchAssignment fonksiyonu
      setLoading(true);  // Loading durumunu true yap
      try {  // Try bloğu
        const assignmentData = await assignmentsApi.getAssignment(  // Assignment API'sini çağır
          numericCourseId,  // Course ID'yi al
          numericLessonId,  // Lesson ID'yi al
          numericAssignmentId  // Assignment ID'yi al
        );
        setAssignment(assignmentData);  // Assignment state'ini güncelle
      } catch (error) {  // Hata durumunda
        console.error('Failed to fetch assignment:', error);  // Hata mesajını konsola yazdır
        toast.error('Ödev detayları yüklenirken bir hata oluştu.');  // Toast mesajı göster
      } finally { 
        setLoading(false);  // Loading durumunu false yap
      }
    };

    fetchAssignment();  // fetchAssignment fonksiyonunu çağır
  }, [numericCourseId, numericLessonId, numericAssignmentId, router]);

  const handleDelete = async () => {  // handleDelete fonksiyonu
    if (!assignment) return;

    if (!confirm(`"${assignment.title}" ödevini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }
    
    try {  // Try bloğu
      await assignmentsApi.deleteAssignment(numericCourseId, numericLessonId, numericAssignmentId);  // Assignment API'sini çağır
      toast.success(`"${assignment.title}" ödevi başarıyla silindi.`);  // Toast mesajı göster
      router.push(`/instructor/courses/${courseId}/assignments`);  // Router'ı güncelle
    } catch (error) {  // Hata durumunda
      console.error('Failed to delete assignment:', error);  // Hata mesajını konsola yazdır
      toast.error('Ödev silinirken bir hata oluştu.');  // Toast mesajı göster
    }
  };

  if (loading) {  // Loading durumunda
    return <LoadingSpinner size="medium" fullScreen />;  // Loading spinner göster
  }

  if (!assignment) {  // Assignment state'i boşsa
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ödev Bulunamadı</h1>
          <p className="text-gray-600 mb-6">İstediğiniz ödev bulunamadı veya erişim yetkiniz yok.</p>
          <Link
            href={`/instructor/courses/${courseId}/assignments`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Ödev Listesine Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href={`/instructor/courses/${courseId}/assignments`}
              className="text-blue-600 hover:text-blue-800 flex items-center mb-4"
            >
              ← Ödev Listesine Dön
            </Link>
            <h1 className="text-3xl font-bold">{assignment.title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href={`/instructor/courses/${courseId}/lessons/${assignment.lesson_id}/assignment/${assignment.id}/submissions`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Gönderileri Görüntüle
            </Link>
            <button
              onClick={handleDelete}
              className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
            >
              Ödevi Sil
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Son Teslim Tarihi</h3>
              <p className="mt-1 text-lg text-gray-900">
                {new Date(assignment.due_date).toLocaleDateString('tr-TR')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Maksimum Puan</h3>
              <p className="mt-1 text-lg text-gray-900">{assignment.max_points}</p>
            </div>
            {assignment.submission_count !== undefined && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Toplam Gönderi</h3>
                <p className="mt-1 text-lg text-gray-900">{assignment.submission_count}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</h3>
              <p className="mt-1 text-lg text-gray-900">
                {new Date(assignment.created_at).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ödev Açıklaması</h3>
            <div className="prose max-w-none">
              {assignment.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 