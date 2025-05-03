'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { quizApi } from '@/lib/api/quiz';
import { Quiz, QuizAttempt, QuizAnswer } from '@/types/quiz';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function QuizResultsPage() {
  const { courseId, lessonId, quizId } = useParams();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);
        
        // First get the quiz details
        const quizData = await quizApi.getQuiz(
          Number(courseId), 
          Number(lessonId), 
          Number(quizId)
        );
        setQuiz(quizData);
        
        // Then get the attempts
        const attemptsData = await quizApi.getQuizResults(
          Number(courseId),
          Number(lessonId),
          Number(quizId)
        );
        setAttempts(attemptsData);
      } catch (error) {
        console.error('Error fetching quiz results:', error);
        toast.error('Sonuçlar yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }
    
    fetchResults();
  }, [courseId, lessonId, quizId]);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get the most recent attempt
  const latestAttempt = attempts.length > 0 
    ? attempts.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0] 
    : null;

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!quiz || !latestAttempt) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 p-4 rounded-md text-yellow-800">
          <h3 className="font-medium">Sonuç bulunamadı</h3>
          <p className="mt-2">Bu sınav için henüz bir sonuç bulunmamaktadır.</p>
          <Link href={`/courses/${courseId}/lessons/${lessonId}`} className="mt-4 block text-blue-600 hover:underline">
            Derse geri dön
          </Link>
        </div>
      </div>
    );
  }

  // Check if passed the quiz
  const isPassed = latestAttempt.score >= quiz.passing_score;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{quiz.title} - Sonuçlar</h1>
        
        <div className="flex space-x-2">
          <Link 
            href={`/courses/${courseId}/lessons/${lessonId}`}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Derse Dön
          </Link>
          
          <Link 
            href={`/courses/${courseId}/lessons/${lessonId}/quizzes`}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Tüm Sınavlar
          </Link>
        </div>
      </div>
      
      {/* Results Summary */}
      <div className={`p-6 rounded-lg mb-8 border ${isPassed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold mb-2">
              {isPassed ? '🎉 Tebrikler!' : '😕 Tekrar Deneyiniz'}
            </h2>
            <p className={`text-lg ${isPassed ? 'text-green-700' : 'text-red-700'}`}>
              {isPassed 
                ? 'Bu sınavı başarıyla tamamladınız.'
                : `Maalesef sınavı geçemediniz. Geçme notu: ${quiz.passing_score}%`
              }
            </p>
          </div>
          
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(latestAttempt.score)}`}>
              %{latestAttempt.score.toFixed(0)}
            </div>
            <div className="text-sm text-gray-500">
              Final Puanı
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded p-3 shadow-sm">
            <div className="text-sm text-gray-500">Tarih</div>
            <div className="font-medium">{formatDate(latestAttempt.completed_at || latestAttempt.started_at)}</div>
          </div>
          
          <div className="bg-white rounded p-3 shadow-sm">
            <div className="text-sm text-gray-500">Süre</div>
            <div className="font-medium">
              {latestAttempt.completed_at 
                ? `${Math.floor((new Date(latestAttempt.completed_at).getTime() - new Date(latestAttempt.started_at).getTime()) / 60000)} dk.`
                : 'Tamamlanmadı'
              }
            </div>
          </div>
          
          <div className="bg-white rounded p-3 shadow-sm">
            <div className="text-sm text-gray-500">Doğru Cevaplar</div>
            <div className="font-medium">
              {latestAttempt.answers.filter(a => a.is_correct).length} / {latestAttempt.answers.length}
            </div>
          </div>
          
          <div className="bg-white rounded p-3 shadow-sm">
            <div className="text-sm text-gray-500">Deneme</div>
            <div className="font-medium">{attempts.length}</div>
          </div>
        </div>
      </div>
      
      {/* Question Review */}
      <h3 className="text-xl font-medium mb-4">Cevap Analizi</h3>
      
      <div className="space-y-6">
        {quiz.questions.map((question, index) => {
          const answer = latestAttempt.answers.find(a => a.question_id === question.id) as QuizAnswer;
          const correctOption = question.options.find(o => o.is_correct);
          
          return (
            <div 
              key={question.id}
              className={`border rounded-lg overflow-hidden ${
                answer?.is_correct ? 'border-green-300' : 'border-red-300'
              }`}
            >
              <div className={`p-4 flex justify-between items-center ${
                answer?.is_correct ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <h4 className="font-medium">
                  Soru {index + 1}: {question.question_text}
                </h4>
                <div className={`font-medium ${answer?.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                  {answer?.points_earned || 0} / {question.points} puan
                </div>
              </div>
              
              <div className="p-4 bg-white">
                <div className="space-y-2">
                  {question.options.map(option => (
                    <div 
                      key={option.id}
                      className={`p-3 rounded-lg border ${
                        option.is_correct 
                          ? 'bg-green-50 border-green-300' 
                          : option.id === answer?.selected_option_id && !option.is_correct
                            ? 'bg-red-50 border-red-300'
                            : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        {option.is_correct && (
                          <span className="text-green-600 mr-2">✓</span>
                        )}
                        {option.id === answer?.selected_option_id && !option.is_correct && (
                          <span className="text-red-600 mr-2">✗</span>
                        )}
                        {option.option_text}
                      </div>
                    </div>
                  ))}
                </div>
                
                {!answer?.is_correct && (
                  <div className="mt-4 text-sm">
                    <span className="font-medium">Doğru Cevap: </span>
                    {correctOption?.option_text}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Actions */}
      <div className="mt-8 pt-4 border-t flex justify-between">
        <Link
          href={`/courses/${courseId}/lessons/${lessonId}`}
          className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Derse Dön
        </Link>
        
        {!isPassed && (
          <Link
            href={`/courses/${courseId}/lessons/${lessonId}/quiz/${quizId}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tekrar Dene
          </Link>
        )}
      </div>
    </div>
  );
}