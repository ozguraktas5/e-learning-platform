'use client';

import { useEffect, useState } from 'react';  // Client-side rendering için directive
import { useParams } from 'next/navigation';  // Route parametrelerini almak için
import { toast } from 'react-hot-toast';  // Toast için
import Link from 'next/link';  // Link için
import { lessonApi } from '@/lib/api/lessons';  // Lesson API'sini içe aktar
import { quizApi } from '@/lib/api/quiz';  // Quiz API'sini içe aktar
import { useAuth } from '@/contexts/AuthContext';  // useAuth hook'u içe aktar
import { Quiz } from '@/types/quiz';  // Quiz tipini içe aktar

interface Lesson {  // Lesson interface'i
  id: number;  // Lesson ID
  title: string;  // Lesson title
  content: string;  // Lesson content
  order: number;  // Lesson order
  course_id: number;  // Course ID
  video_url?: string;  // Lesson video URL
}

interface QuizSummary extends Omit<Quiz, 'questions'> {  // QuizSummary interface'i
  question_count: number; 
  created_at: string;
}

export default function QuizzesPage() {  // QuizzesPage componenti
  const { courseId, lessonId } = useParams();  // Route parametrelerini al
  const { user } = useAuth();  // useAuth hook'u içe aktar
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);  // Quizzes state'ini kontrol et
  const [lesson, setLesson] = useState<Lesson | null>(null);  // Lesson state'ini kontrol et
  const [loading, setLoading] = useState(true);  // Loading durumunu kontrol et
  const isInstructor = user?.role === 'instructor';  // Instructor kontrolü

  useEffect(() => {  // useEffect hook'u ile component mount edildiğinde veya dependency değiştiğinde çalışır
    async function fetchData() {  // fetchData fonksiyonu
      setLoading(true);  // Loading durumunu true yap
      try {  // Try bloğu
        // Fetch lesson details
        const lessonData = await lessonApi.getLesson(Number(courseId), Number(lessonId));  // Lesson API'sini kullanarak lesson detaylarını al
        setLesson(lessonData);  // Lesson state'ini güncelle
        
        const quizzesData = await quizApi.getLessonQuizzes(Number(courseId), Number(lessonId));  // Quiz API'sini kullanarak lesson'a ait quizları al
    
        const quizSummaries = quizzesData.map(quiz => ({  // QuizSummary tipini kullan
          ...quiz,  // Quiz'ı dönüştür
          question_count: quiz.questions?.length || 0,  // Question count
          created_at: quiz.created_at || new Date().toISOString()  // Created at
        }));
        setQuizzes(quizSummaries);  // QuizSummary state'ini güncelle
      } catch (error) {  // Hata durumunda
        console.error('Error fetching data:', error);  // Hata mesajını konsola yazdır
        toast.error('Sınavlar yüklenirken bir hata oluştu');  // Hata mesajını göster
      } finally {  // Finally bloğu
        setLoading(false);  // Loading durumunu false yap
      }
    }
    
    fetchData();  // fetchData fonksiyonunu çağır
  }, [courseId, lessonId]);  // courseId, lessonId değiştiğinde çalışır

  const handleDeleteQuiz = async (quizId: number, quizTitle: string) => {  // handleDeleteQuiz fonksiyonu
    if (!confirm(`"${quizTitle}" sınavını silmek istediğinizden emin misiniz?`)) {  // Quiz title'ını silmek istediğinizden emin misiniz?
      return;  // Fonksiyonu sonlandır
    }
    
    try {  // Try bloğu
      await quizApi.deleteQuiz(Number(courseId), Number(lessonId), quizId);  // Quiz API'sini kullanarak quiz'i sil
      toast.success('Sınav başarıyla silindi');  // Başarı mesajını göster
      setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));  // QuizSummary state'ini güncelle
    } catch (error) {  // Hata durumunda
      console.error('Error deleting quiz:', error);  // Hata mesajını konsola yazdır
      toast.error('Sınav silinirken bir hata oluştu');  // Hata mesajını göster
    }
  };

  if (loading) {  // Loading durumunda
    return (
      <div className="p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-24 bg-gray-200 rounded col-span-1"></div>
                <div className="h-24 bg-gray-200 rounded col-span-1"></div>
                <div className="h-24 bg-gray-200 rounded col-span-1"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {lesson?.title} - Sınavlar
        </h1>
        
        <div className="flex space-x-2">
          <Link 
            href={`/courses/${courseId}/lessons/${lessonId}`} 
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Derse Dön
          </Link>
          
          {isInstructor && (
            <Link 
              href={`/courses/${courseId}/lessons/${lessonId}/quiz/create`} 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Yeni Sınav Ekle
            </Link>
          )}
        </div>
      </div>
      
      {quizzes.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
          <h3 className="text-lg font-medium text-gray-800">Bu ders için sınav bulunmamaktadır</h3>
          {isInstructor && (
            <p className="mt-2 text-gray-600">
              Öğrencilerin öğrenme düzeyini ölçmek için bir sınav ekleyebilirsiniz.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-blue-50 p-4 border-b">
                <h3 className="font-medium text-lg text-gray-800">{quiz.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {quiz.question_count} Soru • {quiz.time_limit ? `${quiz.time_limit} Dakika` : 'Süre Sınırı Yok'}
                </p>
              </div>
              
              <div className="p-4">
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {quiz.description || 'Bu sınav için açıklama bulunmamaktadır.'}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Geçme Notu: {quiz.passing_score}%
                  </div>
                  
                  <div className="flex space-x-2">
                    {isInstructor ? (
                      <>
                        <Link
                          href={`/courses/${courseId}/lessons/${lessonId}/quiz/${quiz.id}/edit`}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                        >
                          Düzenle
                        </Link>
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                          className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded"
                        >
                          Sil
                        </button>
                      </>
                    ) : (
                      <Link
                        href={`/courses/${courseId}/lessons/${lessonId}/quiz/${quiz.id}`}
                        className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                      >
                        Sınava Başla
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 