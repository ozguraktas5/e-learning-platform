'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { lessonApi } from '@/lib/api/lessons';
import { quizApi } from '@/lib/api/quiz';
import { useAuth } from '@/hooks/useAuth';
import { Quiz } from '@/types/quiz';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ArrowLeft, HelpCircle, Clock, Award, Plus, Edit, Trash2 } from 'lucide-react';

interface Lesson {
  id: number;
  title: string;
  content: string;
  order: number;
  course_id: number;
  video_url?: string;
}

interface QuizSummary extends Omit<Quiz, 'questions'> {
  question_count: number;
  created_at: string;
}

export default function QuizzesPage() {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const isInstructor = user?.role === 'instructor';

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Ders detaylarını al
        const lessonData = await lessonApi.getLesson(Number(courseId), Number(lessonId));
        setLesson(lessonData);
        
        // Bu ders için sınavları al
        const quizzesData = await quizApi.getLessonQuizzes(Number(courseId), Number(lessonId));
        // Sınavları QuizSummary[] formatına dönüştür
        const quizSummaries = quizzesData.map(quiz => ({
          ...quiz,
          question_count: quiz.questions?.length || 0,
          created_at: quiz.created_at || new Date().toISOString()
        }));
        setQuizzes(quizSummaries);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Sınavlar yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [courseId, lessonId]);

  const handleDeleteQuiz = async (quizId: number, quizTitle: string) => {
    if (!confirm(`"${quizTitle}" sınavını silmek istediğinizden emin misiniz?`)) {
      return;
    }
    
    try {
      await quizApi.deleteQuiz(Number(courseId), Number(lessonId), quizId);
      toast.success('Sınav başarıyla silindi');
      setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Sınav silinirken bir hata oluştu');
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Başlık */}
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
                    {lesson?.title} - Sınavlar
                  </h1>
                  <p className="text-gray-600 mt-1">Ders sınavlarını görüntüleyin ve çözün</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isInstructor && (
                  <Link 
                    href={`/student/courses/${courseId}/lessons/${lessonId}/quiz/create`} 
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    Yeni Sınav Ekle
                  </Link>
                )}
                <HelpCircle className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>
        
        {/* İçerik */}
        {quizzes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-indigo-50 p-12 text-center">
            <div className="p-6 bg-indigo-50 rounded-full mx-auto w-24 h-24 flex items-center justify-center mb-6">
              <HelpCircle className="h-12 w-12 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Bu ders için sınav bulunmamaktadır</h3>
            {isInstructor ? (
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Öğrencilerin öğrenme düzeyini ölçmek için bir sınav ekleyebilirsiniz.
              </p>
            ) : (
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Henüz bu ders için sınav eklenmemiş. Daha sonra tekrar kontrol edin.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white rounded-2xl shadow-lg border border-indigo-50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-indigo-100">
                  <h3 className="font-bold text-xl text-gray-800 mb-2">{quiz.title}</h3>
                  <div className="flex items-center text-sm text-gray-600 space-x-4">
                    <div className="flex items-center">
                      <HelpCircle className="h-4 w-4 mr-1 text-indigo-500" />
                      <span>{quiz.question_count} Soru</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-purple-500" />
                      <span>{quiz.time_limit ? `${quiz.time_limit} Dakika` : 'Süre Sınırı Yok'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                    {quiz.description || 'Bu sınav için açıklama bulunmamaktadır.'}
                  </p>
                  
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center bg-emerald-50 px-3 py-1 rounded-full">
                      <Award className="h-4 w-4 mr-1 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">
                        Geçme Notu: {quiz.passing_score}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {isInstructor ? (
                      <>
                        <Link
                          href={`/student/courses/${courseId}/lessons/${lessonId}/quiz/${quiz.id}/edit`}
                          className="flex items-center gap-1 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg font-medium transition-colors flex-1 justify-center"
                        >
                          <Edit className="h-4 w-4" />
                          Düzenle
                        </Link>
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                          className="flex items-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-medium transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Sil
                        </button>
                      </>
                    ) : (
                      <Link
                        href={`/student/courses/${courseId}/lessons/${lessonId}/quiz/${quiz.id}`}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <HelpCircle className="h-5 w-5" />
                        Sınava Başla
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 