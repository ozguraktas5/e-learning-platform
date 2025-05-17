'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { lessonApi } from '@/lib/api/lessons';
import { Lesson } from '@/types/lesson';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function LessonDetailPage() {
  const { courseId, lessonId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchLessonDetails();
    // Debug: Log user role
    console.log("Current user:", user);
    setUserRole(user?.role || 'No role');
  }, [courseId, lessonId, user]);

  const fetchLessonDetails = async () => {
    try {
      setLoading(true);
      const data = await lessonApi.getLesson(Number(courseId), Number(lessonId));
      setLesson(data);
    } catch (error) {
      console.error('Error loading lesson details:', error);
      setError('Ders detayları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const navigateToQuizzes = () => {
    router.push(`/courses/${courseId}/lessons/${lessonId}/quizzes`);
  };
  
  const createNewQuiz = () => {
    router.push(`/courses/${courseId}/lessons/${lessonId}/quiz/create`);
  };

  const navigateToAssignments = () => {
    router.push(`/courses/${courseId}/lessons/${lessonId}/assignments`);
  };

  if (loading) return <LoadingSpinner size="medium" fullScreen />;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;
  if (!lesson) return <div className="text-center py-8">Ders bulunamadı</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">{lesson.title}</h1>
              
              <div>
                <p className="text-sm text-gray-500 mb-2">Mevcut Rol: {userRole}</p>
                {/* Conditionally render buttons for any logged in user */}
                {user && (
                  <div className="flex gap-3">
                    <button 
                      onClick={navigateToQuizzes}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                      Tüm Quizler
                    </button>
                    <button 
                      onClick={navigateToAssignments}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                      Tüm Ödevler
                    </button>
                    {user.role === 'instructor' && (
                      <>
                        <button 
                          onClick={createNewQuiz}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Quiz Oluştur
                        </button>
                        <button 
                          onClick={() => router.push(`/courses/${courseId}/lessons/${lessonId}/assignment/create`)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Ödev Oluştur
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="prose max-w-none mb-8">
              {lesson.content}
            </div>

            {lesson.documents.length > 0 && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Ders Dökümanları</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lesson.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <span className="flex-1">{doc.file_name}</span>
                      <span className="text-blue-600">İndir</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}