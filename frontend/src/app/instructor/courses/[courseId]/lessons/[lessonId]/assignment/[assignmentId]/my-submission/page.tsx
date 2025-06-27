'use client';

import { useState, useEffect } from 'react';  // Client-side rendering için directive
import { useParams, useRouter } from 'next/navigation';  // Route parametrelerini almak için
import { assignmentsApi, Assignment, AssignmentSubmission } from '@/lib/api/assignments';  // Assignment API'sini içe aktar
import { useAuth } from '@/contexts/AuthContext';  // Auth hook'unu içe aktar
import { toast } from 'react-hot-toast';  // Toast mesajları için
import Link from 'next/link';  // Link componenti için

export default function MyAssignmentSubmissionPage() {  // MyAssignmentSubmissionPage componenti
  const { courseId, lessonId, assignmentId } = useParams();  // Route parametrelerini al
  const router = useRouter();  // Router instance'ını al
  const { user } = useAuth();  // Auth hook'unu al
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);  // Assignment state'ini tut
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);  // AssignmentSubmission state'ini tut
  const [loading, setLoading] = useState(true);  // Loading durumunu kontrol et
  const [error, setError] = useState<string | null>(null);  // Hata durumunu kontrol et

  useEffect(() => {  // useEffect hook'u ile component mount edildiğinde veya dependency değiştiğinde çalışır
    // Öğrenci kontrolü
    if (user && user.role !== 'student') {  // Kullanıcı rolü öğrenci değilse
      toast.error('Bu sayfayı görüntüleme yetkiniz yok');  // Toast mesajı göster
      router.push(`/courses/${courseId}/lessons/${lessonId}`);  // Router'ı güncelle
      return;  // Fonksiyonu sonlandır
    }

    async function fetchData() {  // fetchData fonksiyonu
      try {  // Try block
        setLoading(true);  // Loading durumunu true yap
        
        // Ödev bilgilerini al
        const assignmentData = await assignmentsApi.getAssignment(
          Number(courseId),
          Number(lessonId),
          Number(assignmentId)
        );
        setAssignment(assignmentData);  // Assignment state'ini güncelle
        
        // Öğrencinin bu ödeve gönderimini al
        try {  // Try block
          const submissionData = await assignmentsApi.getUserSubmission(  // AssignmentSubmission API'sini çağır
            Number(courseId),  // Course ID'yi al
            Number(lessonId),  // Lesson ID'yi al
            Number(assignmentId)  // Assignment ID'yi al
          );
          setSubmission(submissionData);  // AssignmentSubmission state'ini güncelle
        } catch (submissionErr) {
          console.error('Error fetching submission:', submissionErr);  // Hata mesajını konsola yazdır
          // Hata kullanıcıya gösterilmeyecek, sadece loglayıp, submission'ı null bırakacağız
          // Bu şekilde kullanıcı ödev gönderisi oluşturma seçeneğini görecek
        }
      } catch (err) {
        console.error('Error fetching data:', err);  // Hata mesajını konsola yazdır
        setError('Veriler yüklenirken bir hata oluştu.');  // Hata mesajını göster
      } finally {
        setLoading(false);  // Loading durumunu false yap
      }
    }

    fetchData();  // fetchData fonksiyonunu çağır
  }, [courseId, lessonId, assignmentId, router, user]);  // Dependency array

  // Tarih formatını düzenleyen yardımcı fonksiyon
  const formatDate = (dateString: string) => {  // formatDate fonksiyonu
    if (!dateString) return "Tarih yok";  // Tarih yoksa "Tarih yok" döndür
    
    try {  // Try block
      const date = new Date(dateString);  // Tarihi al
      // Tarih geçerli mi kontrol et
      if (isNaN(date.getTime())) {  // Tarih geçersizse
        return "Geçersiz tarih";
      }
      
      return new Intl.DateTimeFormat('tr-TR', {  // Tarihi formatla
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {  // Hata durumunda
      console.error("Date formatting error:", error);  // Hata mesajını konsola yazdır
      return "Geçersiz tarih";  // "Geçersiz tarih" döndür
    }
  };

  if (loading) {  // Loading durumunda
    return (
      <div className="p-6 flex justify-center"> 
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !assignment) {  // Hata durumunda
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