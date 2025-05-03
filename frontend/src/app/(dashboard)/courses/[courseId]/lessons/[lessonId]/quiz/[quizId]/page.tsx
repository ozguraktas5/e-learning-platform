'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { quizApi } from '@/lib/api/quiz';
import { Quiz, QuizQuestion } from '@/types/quiz';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface QuizAnswers {
  [questionId: number]: {
    question_id: number;
    selected_option_id: number | null;
    text?: string;
  };
}

export default function TakeQuizPage() {
  const { courseId, lessonId, quizId } = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const quizData = await quizApi.getQuiz(
          Number(courseId),
          Number(lessonId),
          Number(quizId)
        );
        setQuiz(quizData);
        
        // Initialize answers
        const initialAnswers: QuizAnswers = {};
        quizData.questions.forEach(question => {
          initialAnswers[question.id] = {
            question_id: question.id,
            selected_option_id: null
          };
        });
        setAnswers(initialAnswers);
        
        // Set timer if there's a time limit
        if (quizData.time_limit) {
          setTimeLeft(quizData.time_limit * 60); // Convert minutes to seconds
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast.error('Sınav yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }

    fetchQuiz();
  }, [courseId, lessonId, quizId]);

  // Timer countdown
  useEffect(() => {
    if (!timeLeft) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev > 0) {
          return prev - 1;
        } else {
          clearInterval(timer);
          toast.error('Süre doldu! Sınav otomatik olarak teslim edilecek.');
          handleSubmit();
          return 0;
        }
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleOptionSelect = (questionId: number, optionId: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selected_option_id: optionId
      }
    }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    // Confirm submission
    if (!confirm('Sınavı teslim etmek istediğinizden emin misiniz?')) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Format answers for submission
      const answersArray = Object.values(answers);
      
      // Submit quiz
      await quizApi.submitQuiz(
        Number(courseId),
        Number(lessonId),
        Number(quizId),
        answersArray
      );
      
      toast.success('Sınav başarıyla teslim edildi!');
      
      // Redirect to results page
      router.push(`/courses/${courseId}/lessons/${lessonId}/quiz/${quizId}/results`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Sınav gönderilirken bir hata oluştu');
      setSubmitting(false);
    }
  };

  const navigateQuestion = (direction: 'prev' | 'next') => {
    if (!quiz) return;
    
    if (direction === 'prev' && currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    } else if (direction === 'next' && currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-6">
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          <h3 className="font-medium">Sınav bulunamadı</h3>
          <p className="mt-2">Bu sınav mevcut değil veya erişim izniniz yok.</p>
          <Link href={`/courses/${courseId}/lessons/${lessonId}`} className="mt-4 block text-blue-600 hover:underline">
            Derse geri dön
          </Link>
        </div>
      </div>
    );
  }

  const currentQ: QuizQuestion | undefined = quiz.questions[currentQuestion];

  if (!currentQ) {
    return <div className="p-6">Soru bulunamadı</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        
        {timeLeft !== null && (
          <div className={`text-lg font-medium ${timeLeft < 60 ? 'text-red-600' : 'text-gray-800'}`}>
            Kalan Süre: {formatTime(timeLeft)}
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-500">
            Soru {currentQuestion + 1} / {quiz.questions.length}
          </div>
          <div className="text-sm text-gray-500">
            {currentQ.points} Puan
          </div>
        </div>
        
        <h2 className="text-xl font-medium mb-6">{currentQ.question_text}</h2>
        
        <div className="space-y-4">
          {currentQ.options.map((option) => (
            <div 
              key={option.id} 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                answers[currentQ.id]?.selected_option_id === option.id
                  ? 'bg-blue-50 border-blue-500'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleOptionSelect(currentQ.id, option.id)}
            >
              {option.option_text}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          onClick={() => navigateQuestion('prev')}
          disabled={currentQuestion === 0}
          className="px-4 py-2 border rounded-md disabled:opacity-50"
        >
          &larr; Önceki Soru
        </button>
        
        <div className="flex space-x-2">
          {currentQuestion < quiz.questions.length - 1 ? (
            <button
              onClick={() => navigateQuestion('next')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Sonraki Soru &rarr;
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-green-600 text-white rounded-md disabled:opacity-70"
            >
              {submitting ? 'Teslim Ediliyor...' : 'Sınavı Teslim Et'}
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t">
        <div className="flex flex-wrap gap-2">
          {quiz.questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(index)}
              className={`w-10 h-10 flex items-center justify-center rounded-full border ${
                answers[q.id]?.selected_option_id 
                  ? 'bg-green-100 border-green-500 text-green-800' 
                  : 'bg-gray-100 border-gray-300 text-gray-800'
              } ${currentQuestion === index ? 'ring-2 ring-blue-500' : ''}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}