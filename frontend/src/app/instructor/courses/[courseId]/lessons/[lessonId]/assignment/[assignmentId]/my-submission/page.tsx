'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { assignmentsApi, Assignment, AssignmentSubmission } from '@/lib/api/assignments';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function MyAssignmentSubmissionPage() {
  const { courseId, lessonId, assignmentId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Öğrenci kontrolü
    if (user && user.role !== 'student') {
      toast.error('Bu sayfayı görüntüleme yetkiniz yok');
      router.push(`/courses/${courseId}/lessons/${lessonId}`);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        
        // Ödev bilgilerini al
        const assignmentData = await assignmentsApi.getAssignment(
          Number(courseId),
          Number(lessonId),
          Number(assignmentId)
        );
        setAssignment(assignmentData);
        
        // Öğrencinin bu ödeve gönderimini al
        try {
          const submissionData = await assignmentsApi.getUserSubmission(
            Number(courseId),
            Number(lessonId),
            Number(assignmentId)
          );
          setSubmission(submissionData);
        } catch (submissionErr) {
          console.error('Error fetching submission:', submissionErr);
          // Hata kullanıcıya gösterilmeyecek, sadece loglayıp, submission'ı null bırakacağız
          // Bu şekilde kullanıcı ödev gönderisi oluşturma seçeneğini görecek
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [courseId, lessonId, assignmentId, router, user]);

  // Tarih formatını düzenleyen yardımcı fonksiyon
  const formatDate = (dateString: string) => {
    if (!dateString) return "Tarih yok";
    
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "Geçersiz tarih";
      }
      
      return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Geçersiz tarih";
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="p-6">
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          <h3 className="font-medium">Hata</h3>
          <p className="mt-2">{error || 'Ödev bulunamadı'}</p>
          <Link href={`/courses/${courseId}/lessons/${lessonId}/assignments`} className="mt-4 block text-blue-600 hover:underline">
            Ödevlere geri dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Ödev Sonucu: {assignment.title}</h1>
          <Link
            href={`/courses/${courseId}/lessons/${lessonId}/assignments`} 
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Ödevlere Dön
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-medium mb-2">Ödev Bilgileri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Teslim Tarihi:</span> {formatDate(assignment.due_date)}
              </div>
              <div>
                <span className="font-medium">Maksimum Puan:</span> {assignment.max_points}
              </div>
            </div>
            
            <div className="mt-3 text-sm">
              <div className="font-medium mb-1">Açıklama:</div>
              <div className="text-gray-700 whitespace-pre-line">{assignment.description}</div>
            </div>
          </div>
        </div>

        {!submission ? (
          <div className="bg-yellow-50 p-6 rounded-lg text-center">
            <p className="text-yellow-800 font-medium">Henüz bu ödeve bir gönderi yapmadınız.</p>
            <div className="mt-4">
              <Link 
                href={`/courses/${courseId}/lessons/${lessonId}/assignment/${assignment.id}/submit`}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 inline-block"
              >
                Şimdi Gönder
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">Gönderiniz</h2>
                <div className="text-sm text-gray-500">
                  Gönderim Tarihi: {formatDate(submission.submitted_at)}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded border whitespace-pre-line text-gray-800 min-h-[200px]">
                {submission.submission_text || 'İçerik yok'}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Değerlendirme Sonucu</h3>
              
              {submission.grade !== null && submission.grade !== undefined ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="text-2xl font-bold">
                      {submission.grade} / {assignment.max_points}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      submission.grade >= (assignment.max_points * 0.7) 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {submission.grade >= (assignment.max_points * 0.7) ? 'Başarılı' : 'Başarısız'}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="font-medium mb-2">Eğitmen Geri Bildirimi:</div>
                    <div className="bg-blue-50 p-4 rounded border border-blue-100 text-gray-800 whitespace-pre-line min-h-[100px]">
                      {submission.feedback || 'Geri bildirim yok'}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Değerlendirme Tarihi: {submission.graded_at ? formatDate(submission.graded_at) : 'Değerlendirme bekliyor'}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 p-4 rounded text-yellow-800">
                  <p>Gönderiniz henüz değerlendirilmemiştir. Değerlendirme sonucu burada görüntülenecektir.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 