'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { quizApi } from '@/lib/api/quiz';
import { Quiz, QuizQuestion } from '@/types/quiz';

export default function TakeQuizPage() {
  const { courseId, lessonId, quizId } = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    fetchQuiz();
  }, []);

  useEffect(() => {
    if (quiz?.time_limit) {
      setTimeLeft(quiz.time_limit * 60);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 0) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const data = await quizApi.getQuiz(Number(courseId), Number(lessonId), Number(quizId));
      setQuiz(data);
    } catch (err) {
      setError('Quiz yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: number, optionId: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const answers = Object.entries(selectedAnswers).map(([questionId, optionId]) => ({
        question_id: parseInt(questionId),
        selected_option_id: optionId
      }));

      const result = await quizApi.submitQuiz(
        Number(courseId),
        Number(lessonId),
        Number(quizId),
        answers
      );

      router.push(`/courses/${courseId}/lessons/${lessonId}/quiz/${quizId}/results`);
    } catch (err) {
      setError('Quiz gönderilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Yükleniyor...</div>;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;
  if (!quiz) return <div className="text-center py-8">Quiz bulunamadı</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            {timeLeft !== null && (
              <div className="text-lg font-medium">
                Kalan Süre: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>

          <p className="text-gray-600 mb-8">{quiz.description}</p>

          <div className="space-y-8">
            {quiz.questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">
                  {index + 1}. {question.question_text}
                </h3>
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`question_${question.id}`}
                        checked={selectedAnswers[question.id] === option.id}
                        onChange={() => handleAnswerSelect(question.id, option.id)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span>{option.option_text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Gönderiliyor...' : 'Quiz\'i Tamamla'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}