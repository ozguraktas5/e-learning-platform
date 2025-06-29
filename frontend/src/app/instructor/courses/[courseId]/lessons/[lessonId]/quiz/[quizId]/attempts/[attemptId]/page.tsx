'use client';

import { useState, useEffect } from 'react';  // Client-side rendering için directive
import { useParams, useRouter } from 'next/navigation';  // Route parametrelerini almak için
import { quizApi } from '@/lib/api/quiz';  // Quiz API'sini içe aktar
import { Quiz, QuizAttempt } from '@/types/quiz';  // Quiz ve QuizAttempt tipini içe aktar

export default function QuizAttemptDetailPage() {  // QuizAttemptDetailPage componenti
  const { courseId, lessonId, quizId, attemptId } = useParams();  // Route parametrelerini al
  const router = useRouter();  // Router instance'ını al
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);  // Attempt state'ini tut
  const [quiz, setQuiz] = useState<Quiz | null>(null);  // Quiz state'ini tut
  const [loading, setLoading] = useState(true);  // Loading durumunu kontrol et
  const [error, setError] = useState<string | null>(null);  // Hata durumunu kontrol et

  useEffect(() => {  // useEffect hook'u ile component mount edildiğinde veya dependency değiştiğinde çalışır
    fetchAttemptDetails();  // fetchAttemptDetails fonksiyonunu çağır
  }, []);  // Dependency array

  const fetchAttemptDetails = async () => {  // fetchAttemptDetails fonksiyonu
    try {  // Try bloğu
      setLoading(true);  // Loading durumunu true yap
      const [quizData, attemptData] = await Promise.all([  // Quiz ve Attempt data'larını al
        quizApi.getQuiz(Number(courseId), Number(lessonId), Number(quizId)),
        quizApi.getAttemptDetails(Number(attemptId))  // Attempt detaylarını al
      ]);
      setQuiz(quizData);  // Quiz state'ini güncelle
      setAttempt(attemptData);  // Attempt state'ini güncelle
    } catch (err) {  // Hata durumunda
      setError('Sonuç detayları yüklenirken bir hata oluştu');  // Hata mesajını göster
    } finally {
      setLoading(false);  // Loading durumunu false yap
    }
  };

  if (loading) return <div className="text-center py-8">Yükleniyor...</div>;  // Loading durumunda
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;  // Hata durumunda
  if (!quiz || !attempt) return <div className="text-center py-8">Sonuç bulunamadı</div>;  // Quiz veya Attempt yoksa

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">{quiz.title} - Detaylı Sonuç</h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Toplam Puan</p>
                <p className="text-2xl font-bold">%{attempt.score.toFixed(1)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Doğru Sayısı</p>
                <p className="text-2xl font-bold">
                  {attempt.answers.filter(a => a.is_correct).length}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600">Yanlış Sayısı</p>
                <p className="text-2xl font-bold">
                  {attempt.answers.filter(a => !a.is_correct).length}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600">Durum</p>
                <p className="text-2xl font-bold">
                  {attempt.score >= quiz.passing_score ? 'Başarılı' : 'Başarısız'}
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {quiz.questions.map((question, index) => {
                const answer = attempt.answers.find(a => a.question_id === question.id);
                const selectedOption = question.options.find(o => o.id === answer?.selected_option_id);
                const correctOption = question.options.find(o => o.is_correct);

                return (
                  <div key={question.id} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-medium">
                        {index + 1}. {question.question_text}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium
                        ${answer?.is_correct 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'}`}>
                        {answer?.points_earned || 0} / {question.points} puan
                      </span>
                    </div>

                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <div
                          key={option.id}
                          className={`p-3 rounded-lg ${
                            option.id === answer?.selected_option_id
                              ? option.is_correct
                                ? 'bg-green-100'
                                : 'bg-red-100'
                              : option.is_correct
                                ? 'bg-green-50'
                                : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="mr-2">
                              {option.id === answer?.selected_option_id ? '✓' : '○'}
                            </span>
                            {option.option_text}
                          </div>
                        </div>
                      ))}
                    </div>

                    {!answer?.is_correct && (
                      <div className="mt-4 text-sm text-gray-600">
                        <p className="font-medium">Doğru Cevap:</p>
                        <p>{correctOption?.option_text}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8">
              <button
                onClick={() => router.back()}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Sonuçlara Dön
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}