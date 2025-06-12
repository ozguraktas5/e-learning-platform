'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { assignmentsApi, Assignment, AssignmentSubmission } from '@/lib/api/assignments';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AssignmentSubmissionsPage() {
  const { courseId, lessonId, assignmentId } = useParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const numericCourseId = Number(courseId);
  const numericLessonId = Number(lessonId);
  const numericAssignmentId = Number(assignmentId);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Ödev detaylarını al
        const assignmentData = await assignmentsApi.getAssignment(
          numericCourseId,
          numericLessonId,
          numericAssignmentId
        );
        setAssignment(assignmentData);

        // Ödev gönderilerini al
        const submissionsData = await assignmentsApi.getAssignmentSubmissions(
          numericCourseId,
          numericLessonId,
          numericAssignmentId
        );
        setSubmissions(submissionsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    if (!isNaN(numericCourseId) && !isNaN(numericLessonId) && !isNaN(numericAssignmentId)) {
      fetchData();
    } else {
      toast.error('Geçersiz URL parametreleri');
      router.push('/instructor/courses');
    }
  }, [numericCourseId, numericLessonId, numericAssignmentId, router]);

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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/instructor/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}`}
            className="text-blue-600 hover:text-blue-800 flex items-center mb-4"
          >
            ← Ödev Detaylarına Dön
          </Link>
          <h1 className="text-3xl font-bold mb-2">{assignment.title}</h1>
          <p className="text-gray-600">Toplam {submissions.length} gönderi</p>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">Bu ödev için henüz gönderi yapılmamış.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {submissions.map((submission) => (
              <div key={submission.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Gönderi #{submission.id}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Gönderilme Tarihi: {new Date(submission.submitted_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="text-right">
                    {submission.grade !== null ? (
                      <div>
                        <span className="inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                          Puan: {submission.grade}/{assignment.max_points}
                        </span>
                        {submission.graded_at && (
                          <p className="text-sm text-gray-500 mt-1">
                            Değerlendirilme: {new Date(submission.graded_at).toLocaleDateString('tr-TR')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-block bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
                        Değerlendirilmedi
                      </span>
                    )}
                  </div>
                </div>

                <div className="prose max-w-none mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Gönderi İçeriği:</h4>
                  <div className="bg-gray-50 rounded p-4">
                    {submission.submission_text}
                  </div>
                </div>

                {submission.file_url && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Ek Dosya:</h4>
                    <a
                      href={submission.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Dosyayı İndir
                    </a>
                  </div>
                )}

                {submission.feedback && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Geri Bildirim:</h4>
                    <div className="bg-blue-50 text-blue-800 rounded p-4">
                      {submission.feedback}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 