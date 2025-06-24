'use client';

import { useState, useEffect } from 'react';  // Client-side rendering için directive
import { useParams, useRouter } from 'next/navigation';  // Route parametrelerini almak için
import { quizApi, ApiErrorResponse } from '@/lib/api/quiz';  // Quiz API'sini içe aktar
import { coursesApi } from '@/lib/api/courses';  // Courses API'sini içe aktar
import { Quiz, QuizQuestion } from '@/types/quiz';  // Quiz ve QuizQuestion tipini içe aktar
import { toast } from 'react-hot-toast';  // Toast için
import Link from 'next/link';  // Link için

interface QuizAnswers {  // QuizAnswers interface'i
  [questionId: number]: {
    question_id: number;
    selected_option_id: number | null;
    text?: string;
  };
}

export default function TakeQuizPage() {  // TakeQuizPage componenti
  const { courseId, lessonId, quizId } = useParams();  // Route parametrelerini al
  const router = useRouter();  // Router için
  const [quiz, setQuiz] = useState<Quiz | null>(null);  // Quiz state'ini tut
  const [loading, setLoading] = useState(true);  // Loading durumunu kontrol et
  const [answers, setAnswers] = useState<QuizAnswers>({});  // Answers state'ini tut
  const [currentQuestion, setCurrentQuestion] = useState(0);  // Current question state'ini tut
  const [timeLeft, setTimeLeft] = useState<number | null>(null);  // Time left state'ini tut
  const [submitting, setSubmitting] = useState(false);  // Submitting state'ini tut
  const [quizNotFound, setQuizNotFound] = useState(false);  // Quiz not found state'ini tut
  const [error, setError] = useState<string | null>(null);  // Error state'ini tut

  useEffect(() => {  // useEffect hook'u ile component mount edildiğinde veya dependency değiştiğinde çalışır
    async function fetchQuiz() {  // fetchQuiz fonksiyonu
      try {  // Try bloğu
        setLoading(true);  // Loading durumunu true yap
        const response = await quizApi.getQuiz(  // Quiz API'sini kullanarak quiz'i al
          Number(courseId),  // Course ID'yi al
          Number(lessonId),  // Lesson ID'yi al
          Number(quizId)  // Quiz ID'yi al
        );
        
        // API'nin hata döndürdüğü kontrol edilmeli
        if ('error' in response && response.not_found) {  // ApiErrorResponse tipini kullan
          setQuizNotFound(true);  // Quiz not found state'ini true yap
          return;  // Fonksiyonu sonlandır
        }
        
        // Normal quiz yanıtı
        const quizData = response as Quiz;  // Quiz tipini kullan
        setQuiz(quizData);  // Quiz state'ini güncelle
        
        // Initialize answers
        const initialAnswers: QuizAnswers = {};  // QuizAnswers tipini kullan
        quizData.questions.forEach(question => {  // QuizQuestion tipini kullan
          initialAnswers[question.id] = {  // QuizAnswers tipini kullan
            question_id: question.id,
            selected_option_id: null 
          };
        });
        setAnswers(initialAnswers);
        
        // Süre limiti varsa timer'ı ayarla
        if (quizData.time_limit) {  // QuizData tipini kullan
          setTimeLeft(quizData.time_limit * 60);  // Süre limitini saniyeye çevir
        }
      } catch (error) {  // Hata durumunda
        console.error('Error fetching quiz:', error);  // Hata mesajını konsola yazdır
        setError('Sınav yüklenirken bir hata oluştu');  // Hata mesajını göster
        toast.error('Sınav yüklenirken bir hata oluştu');  // Hata mesajını göster
      } finally {
        setLoading(false);  // Loading durumunu false yap
      }
    } 

    fetchQuiz();  // fetchQuiz fonksiyonunu çağır
  }, [courseId, lessonId, quizId]);  // courseId, lessonId, quizId değiştiğinde çalışır

  // Timer countdown
  useEffect(() => {  // useEffect hook'u ile component mount edildiğinde veya dependency değiştiğinde çalışır
    if (!timeLeft) return;  // Time left null ise fonksiyonu sonlandır
    
    const timer = setInterval(() => {  // Timer'ı ayarla
      setTimeLeft(prev => {  // Time left state'ini güncelle
        if (prev && prev > 0) {  // Time left 0'dan büyükse
          return prev - 1;  // Time left'i 1 azalt
        } else {  // Time left 0'dan küçükse
          clearInterval(timer);  // Timer'ı temizle
          toast.error('Süre doldu! Sınav otomatik olarak teslim edilecek.');  // Hata mesajını göster
          handleSubmit();  // handleSubmit fonksiyonunu çağır
          return 0;  // Time left'i 0 yap
        }
      });
    }, 1000);  // 1 saniye beklet
    
    return () => clearInterval(timer);  // Timer'ı temizle
  }, [timeLeft]);  // timeLeft değiştiğinde çalışır

  const handleOptionSelect = (questionId: number, optionId: number) => {  // handleOptionSelect fonksiyonu
    setAnswers(prev => ({  // Answers state'ini güncelle
      ...prev,
      [questionId]: {
        ...prev[questionId], 
        selected_option_id: optionId
      }
    }));
  };

  const handleSubmit = async () => {  // handleSubmit fonksiyonu
    if (submitting) return;  // Submitting true ise fonksiyonu sonlandır
    
    // Sınavı teslim etmek istediğinizden emin misiniz?
    if (!confirm('Sınavı teslim etmek istediğinizden emin misiniz?')) {
      return;  // Fonksiyonu sonlandır
    }
    
    setSubmitting(true);  // Submitting state'ini true yap
    
    try {  // Try bloğu
      // Cevapları formatla
      const answersArray = Object.values(answers);  // Answers state'ini array'e çevir
      
      // Sınavı teslim et 
      await quizApi.submitQuiz( 
        Number(courseId),  // Course ID'yi al
        Number(lessonId),  // Lesson ID'yi al
        Number(quizId),  // Quiz ID'yi al
        answersArray  // Answers state'ini gönder
      );
      
      toast.success('Sınav başarıyla teslim edildi!');  // Başarı mesajını göster
      
      // Sonuçlar sayfasına yönlendir
      router.push(`/courses/${courseId}/lessons/${lessonId}/quiz/${quizId}/results`);
    } catch (error) {  // Hata durumunda
      console.error('Error submitting quiz:', error);  // Hata mesajını konsola yazdır
      
      // 403 hatası için özel mesaj
      const axiosError = error as any;
      if (axiosError.response && axiosError.response.status === 403) {
        toast.error('Bu quizi çözmek için kursa kayıtlı olmalısınız');  // Hata mesajını göster
        
        // Kursa kayıt için yönlendir veya popup göster
        if (confirm('Bu quizi çözmek için kursa kayıtlı olmanız gerekiyor. Şimdi kaydolmak ister misiniz?')) {
          try {  // Try bloğu
            await coursesApi.enrollInCourse(Number(courseId));  // Kursa kayıt için yönlendir
            toast.success('Kursa başarıyla kaydoldunuz! Şimdi quizi tekrar gönderebilirsiniz.');  // Başarı mesajını göster
            setSubmitting(false);  // Submitting state'ini false yap
          } catch (enrollError) {
            console.error('Error enrolling to course:', enrollError);  // Hata mesajını konsola yazdır
            toast.error('Kursa kaydolurken bir hata oluştu');  // Hata mesajını göster
            router.push(`/courses/${courseId}`);  // Kursa yönlendir
          }
        } else {
          router.push(`/courses/${courseId}`);  // Kursa yönlendir
        }
      } else {
        toast.error('Sınav gönderilirken bir hata oluştu');  // Hata mesajını göster
        setSubmitting(false);
      }
    }
  };

  const navigateQuestion = (direction: 'prev' | 'next') => {  // navigateQuestion fonksiyonu
    if (!quiz) return;  // Quiz null ise fonksiyonu sonlandır
    
    if (direction === 'prev' && currentQuestion > 0) {  // Direction prev ise ve currentQuestion 0'dan büyükse
      setCurrentQuestion(prev => prev - 1);  // Current question'ı 1 azalt
    } else if (direction === 'next' && currentQuestion < quiz.questions.length - 1) {  // Direction next ise ve currentQuestion quiz'in questions'ının uzunluğundan 1 küçükse
      setCurrentQuestion(prev => prev + 1);  // Current question'ı 1 artır
    }
  };

  const formatTime = (seconds: number): string => {  // formatTime fonksiyonu
    const minutes = Math.floor(seconds / 60);  // Saniyeyi dakikaya çevir
    const remainingSeconds = seconds % 60;  // Kalan saniyeyi al
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;  // Dakika ve saniye formatını döndür
  };

  if (loading) {  // Loading durumunda
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (quizNotFound) {  // Quiz not found durumunda
    return (
      <div className="p-6">
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          <h3 className="font-medium text-xl">Quiz Bulunamadı</h3>
          <p className="mt-2">Aradığınız quiz sistemde bulunmuyor veya silinmiş olabilir.</p>
          <Link href={`/courses/${courseId}/lessons/${lessonId}`} className="mt-4 block text-blue-600 hover:underline">
            Derse geri dön
          </Link>
        </div>
      </div>
    );
  }

  if (error) {  // Error durumunda
    return (
      <div className="p-6">
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          <h3 className="font-medium">Hata</h3>
          <p className="mt-2">{error}</p>
          <Link href={`/courses/${courseId}/lessons/${lessonId}`} className="mt-4 block text-blue-600 hover:underline">
            Derse geri dön
          </Link>
        </div>
      </div>
    );
  }

  if (!quiz) {  // Quiz null ise
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

  const currentQ: QuizQuestion | undefined = quiz.questions[currentQuestion];  // QuizQuestion tipini kullan

  if (!currentQ) {  // CurrentQ null ise
    return <div className="p-6">Soru bulunamadı</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
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