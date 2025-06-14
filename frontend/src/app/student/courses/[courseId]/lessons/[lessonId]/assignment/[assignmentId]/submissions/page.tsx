'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { assignmentsApi, Assignment, AssignmentSubmission } from '@/lib/api/assignments';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function AssignmentSubmissionsPage() {
  const { courseId, lessonId, assignmentId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [feedback, setFeedback] = useState('');
  const [grade, setGrade] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Eğitmen kontrolü
    if (user && user.role !== 'instructor') {
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
        
        // Ödev gönderimlerini al
        const submissionsData = await assignmentsApi.getAssignmentSubmissions(
          Number(courseId),
          Number(lessonId),
          Number(assignmentId)
        );
        setSubmissions(submissionsData);
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

  const handleSubmissionSelect = (submission: AssignmentSubmission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade || 0);
    setFeedback(submission.feedback || '');
  };

  const handleGradeSubmit = async () => {
    if (!selectedSubmission) return;
    
    try {
      setSubmitting(true);
      
      const result = await assignmentsApi.gradeSubmission(
        Number(courseId),
        Number(lessonId),
        Number(assignmentId),
        selectedSubmission.id,
        {
          grade: grade,
          feedback: feedback
        }
      );
      
      // Değerlendirilen ödevi güncelle
      setSubmissions(prev => prev.map(sub => 
        sub.id === selectedSubmission.id ? result.submission : sub
      ));
      
      setSelectedSubmission(result.submission);
      toast.success('Ödev başarıyla değerlendirildi!');
    } catch (err) {
      console.error('Error grading submission:', err);
      toast.error('Ödev değerlendirilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ödev Gönderileri: {assignment.title}</h1>
        <Link
          href={`/courses/${courseId}/lessons/${lessonId}/assignments`} 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Ödevlere Dön
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol taraf - Ödev detayları ve gönderim listesi */}
        <div className="lg:col-span-1">
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <h2 className="text-lg font-medium mb-2">Ödev Bilgileri</h2>
            <div className="mb-2 text-sm text-gray-600">
              <p><span className="font-medium">Teslim Tarihi:</span> {formatDate(assignment.due_date)}</p>
              <p><span className="font-medium">Maksimum Puan:</span> {assignment.max_points}</p>
              <p><span className="font-medium">Toplam Gönderim:</span> {submissions.length}</p>
            </div>
            
            <div className="mt-3 text-sm">
              <div className="font-medium mb-1">Açıklama:</div>
              <div className="text-gray-700 whitespace-pre-line">{assignment.description}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4">Gönderiler ({submissions.length})</h2>
            
            {submissions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Henüz hiç ödev gönderimi yok.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {submissions.map(submission => (
                  <div 
                    key={submission.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSubmission?.id === submission.id 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSubmissionSelect(submission)}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium">Öğrenci #{submission.user_id}</div>
                      <div className="text-xs text-gray-500">{formatDate(submission.submitted_at)}</div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <div>
                        {submission.grade !== null && submission.grade !== undefined ? (
                          <span className={`${
                            submission.grade >= 70 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            Puan: {submission.grade}
                          </span>
                        ) : (
                          <span className="text-yellow-600">Değerlendirilmedi</span>
                        )}
                      </div>
                      <div>
                        {submission.graded_at ? (
                          <span className="text-gray-500 text-xs">
                            {formatDate(submission.graded_at)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sağ taraf - Gönderim detayları ve değerlendirme */}
        <div className="lg:col-span-2">
          {selectedSubmission ? (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-medium mb-2">Öğrenci Cevabı</h2>
                <div className="bg-gray-50 p-4 rounded border whitespace-pre-line text-gray-800 min-h-[200px]">
                  {selectedSubmission.submission_text || 'İçerik yok'}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Değerlendirme</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Puan (0-{assignment.max_points})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={assignment.max_points}
                    value={grade}
                    onChange={e => setGrade(Math.min(Number(e.target.value), assignment.max_points))}
                    className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Geri Bildirim
                  </label>
                  <textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Öğrenciye geri bildirim yazın..."
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleGradeSubmit}
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {submitting ? 'Kaydediliyor...' : 'Değerlendirmeyi Kaydet'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <p className="text-gray-600">Detayları görüntülemek için sol taraftan bir ödev gönderimi seçin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 