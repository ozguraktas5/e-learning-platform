'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { assignmentsApi } from '@/lib/api/assignments';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Assignment {
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

export default function AssignmentDetailsPage() {
  const { courseId, lessonId, assignmentId } = useParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  const numericCourseId = Number(courseId);
  const numericLessonId = Number(lessonId);
  const numericAssignmentId = Number(assignmentId);

  useEffect(() => {
    if (isNaN(numericCourseId) || isNaN(numericLessonId) || isNaN(numericAssignmentId)) {
      toast.error('Geçersiz URL parametreleri');
      router.push('/instructor/courses');
      return;
    }

    const fetchAssignment = async () => {
      setLoading(true);
      try {
        const assignmentData = await assignmentsApi.getAssignment(
          numericCourseId,
          numericLessonId,
          numericAssignmentId
        );
        setAssignment(assignmentData);
      } catch (error) {
        console.error('Failed to fetch assignment:', error);
        toast.error('Ödev detayları yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [numericCourseId, numericLessonId, numericAssignmentId, router]);

  const handleDelete = async () => {
    if (!assignment) return;

    if (!confirm(`"${assignment.title}" ödevini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }
    
    try {
      await assignmentsApi.deleteAssignment(numericCourseId, numericLessonId, numericAssignmentId);
      toast.success(`"${assignment.title}" ödevi başarıyla silindi.`);
      router.push(`/instructor/courses/${courseId}/assignments`);
    } catch (error) {
      console.error('Failed to delete assignment:', error);
      toast.error('Ödev silinirken bir hata oluştu.');
    }
  };

  if (loading) {
    return <LoadingSpinner size="medium" fullScreen />;
  }

  if (!assignment) {
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
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
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