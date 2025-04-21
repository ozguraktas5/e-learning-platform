'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { quizApi } from '@/lib/api/quiz';
import { Quiz, QuizAttempt } from '@/types/quiz';
import { useAuth } from '@/lib/hooks/useAuth';

export default function QuizResultsPage() {
  const { courseId, lessonId, quizId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizAndResults();
  }, []);

  const fetchQuizAndResults = async () => {
    try {
      setLoading(true);
      const [quizData, resultsData] = await Promise.all([
        quizApi.getQuiz(Number(courseId), Number(lessonId), Number(quizId)),
        quizApi.getQuizResults(Number(courseId), Number(lessonId), Number(quizId))
      ]);
      setQuiz(quizData);
      setAttempts(resultsData);
    } catch (err) {
      setError('Sonuçlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTimeSpent = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    return `${diffInMinutes} dakika`;
  };

  if (loading) return <div className="text-center py-8">Yükleniyor...</div>;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;
  if (!quiz) return <div className="text-center py-8">Quiz bulunamadı</div>;

  // Öğrenci sadece kendi sonuçlarını görebilir
  const filteredAttempts = user?.role === 'student' 
    ? attempts.filter(attempt => attempt.user_id === Number(user.id))
    : attempts;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
            <p className="text-gray-600 mb-6">{quiz.description}</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Geçme Notu</p>
                <p className="text-2xl font-bold">%{quiz.passing_score}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Toplam Soru</p>
                <p className="text-2xl font-bold">{quiz.questions.length}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600">Deneme Sayısı</p>
                <p className="text-2xl font-bold">{filteredAttempts.length}</p>
              </div>
            </div>

            {filteredAttempts.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">
                  {user?.role === 'student' ? 'Sonuçlarınız' : 'Tüm Sonuçlar'}
                </h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {user?.role === 'instructor' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Öğrenci
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Başlama Tarihi
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Süre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Puan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Detay
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAttempts.map((attempt) => (
                        <tr key={attempt.id}>
                          {user?.role === 'instructor' && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              {attempt.user_id}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {formatDate(attempt.started_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {attempt.completed_at 
                              ? calculateTimeSpent(attempt.started_at, attempt.completed_at)
                              : 'Tamamlanmadı'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium">%{attempt.score.toFixed(1)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${attempt.score >= quiz.passing_score 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'}`}>
                              {attempt.score >= quiz.passing_score ? 'Başarılı' : 'Başarısız'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => router.push(`/courses/${courseId}/lessons/${lessonId}/quiz/${quizId}/attempts/${attempt.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Detaylı Sonuç
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Henüz quiz denemesi bulunmuyor.
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => router.back()}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Geri Dön
              </button>
              {user?.role === 'student' && (
                <button
                  onClick={() => router.push(`/courses/${courseId}/lessons/${lessonId}/quiz/${quizId}`)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Quiz'i Tekrar Çöz
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}