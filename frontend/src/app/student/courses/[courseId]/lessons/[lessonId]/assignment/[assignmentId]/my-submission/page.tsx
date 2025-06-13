'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { assignmentsApi, Assignment, AssignmentSubmission } from '@/lib/api/assignments';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ArrowLeft, ClipboardList, Clock, Award, CheckCircle, AlertTriangle, FileText, MessageSquare, Calendar } from 'lucide-react';

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
      router.push(`/student/courses/${courseId}/lessons/${lessonId}`);
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
          // 404 hatası submission olmadığını gösterir, bu normal bir durum
          const error = submissionErr as { response?: { status?: number } };
          if (error?.response?.status === 404) {
            console.log('No submission found for this assignment - this is expected');
            setSubmission(null);
          } else {
            console.error('Error fetching submission:', submissionErr);
          }
          // Her iki durumda da submission null kalacak ve kullanıcı gönderi yapma seçeneğini görecek
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
    return <LoadingSpinner size="large" fullScreen />;
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="font-semibold text-lg">Hata Oluştu</h3>
            </div>
            <p className="mb-4">{error || 'Ödev bulunamadı'}</p>
            <Link 
              href={`/student/courses/${courseId}/lessons/${lessonId}/assignments`} 
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Ödevlere Geri Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-indigo-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href={`/student/courses/${courseId}/lessons/${lessonId}/assignments`}
                  className="p-2 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-indigo-600" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {assignment.title}
                  </h1>
                  <p className="text-gray-600 mt-1">Ödev Sonucu</p>
                </div>
              </div>
              <ClipboardList className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Assignment Details */}
        <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-indigo-100 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Ödev Bilgileri
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Teslim Tarihi</p>
                <p className="text-blue-800 font-semibold">{formatDate(assignment.due_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Award className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600 font-medium">Maksimum Puan</p>
                <p className="text-purple-800 font-semibold">{assignment.max_points}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Açıklama:</h3>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">{assignment.description}</p>
          </div>
        </div>

        {/* Submission Status */}
        {!submission ? (
          <div className="backdrop-blur-sm bg-yellow-50/90 border border-yellow-200 rounded-2xl p-6 shadow-lg text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-yellow-800 mb-2">Henüz Gönderi Yok</h3>
            <p className="text-yellow-700 mb-6">Bu ödeve henüz bir gönderi yapmadınız.</p>
            <Link 
              href={`/student/courses/${courseId}/lessons/${lessonId}/assignment/${assignment.id}/submit`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <ClipboardList className="h-4 w-4" />
              Şimdi Gönder
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Submission Content */}
            <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-indigo-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Gönderiniz
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Gönderim: {formatDate(submission.submitted_at)}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
                <p className="text-gray-800 whitespace-pre-line leading-relaxed">
                  {submission.submission_text || 'İçerik yok'}
                </p>
              </div>
            </div>

            {/* Evaluation Results */}
            <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-indigo-100 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-600" />
                Değerlendirme Sonucu
              </h3>
              
              {submission.grade !== null && submission.grade !== undefined ? (
                <div className="space-y-6">
                  {/* Grade Display */}
                  <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900 mb-1">
                        {submission.grade} / {assignment.max_points}
                      </div>
                      <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                        submission.grade >= (assignment.max_points * 0.7) 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {submission.grade >= (assignment.max_points * 0.7) ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Başarılı
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            Başarısız
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Feedback */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-indigo-600" />
                      Eğitmen Geri Bildirimi
                    </h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 min-h-[100px]">
                      <p className="text-gray-800 whitespace-pre-line leading-relaxed">
                        {submission.feedback || 'Geri bildirim yok'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Grading Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 pt-4 border-t border-gray-200">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Değerlendirme Tarihi: {submission.graded_at ? formatDate(submission.graded_at) : 'Değerlendirme bekliyor'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <Clock className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-yellow-800 mb-2">Değerlendirme Bekleniyor</h4>
                  <p className="text-yellow-700">
                    Gönderiniz henüz değerlendirilmemiştir. Değerlendirme sonucu burada görüntülenecektir.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 