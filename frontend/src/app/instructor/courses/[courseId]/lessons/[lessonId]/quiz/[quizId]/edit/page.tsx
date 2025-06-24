'use client';

import { useState, useEffect } from 'react';  // Client-side rendering için directive
import { useParams, useRouter } from 'next/navigation';  // Route parametrelerini almak için
import { useForm } from 'react-hook-form';  // Form işleme için
import { zodResolver } from '@hookform/resolvers/zod';  // Zod resolver için
import { z } from 'zod';  // Zod için
import { quizApi, ApiErrorResponse } from '@/lib/api/quiz';  // Quiz API'sini içe aktar
import { Quiz, QuizQuestion } from '@/types/quiz';  // Quiz ve QuizQuestion tipini içe aktar

interface QuizFormValues {  // QuizFormValues interface'i
  title: string;
  description: string;
  time_limit: number | null;
  passing_score: number;
  questions: {
    question_text: string;
    points: number;
    options: {
      option_text: string;
      is_correct: boolean;
    }[];
  }[];
}

const quizSchema = z.object({  // Quiz şeması
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır'),  // Title alanı
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'),  // Description alanı
  time_limit: z.preprocess(
    val => val === '' ? null : Number(val),  // Boş string'i null yap
    z.number().nullable()  // Zorunlu alan
  ),
  passing_score: z.number().min(0).max(100),  // Passing score alanı
  questions: z.array(z.object({
    question_text: z.string().min(1, 'Soru metni gereklidir'),
    points: z.number().min(1, 'Puan 1 veya daha büyük olmalıdır'),
    options: z.array(z.object({
      option_text: z.string().min(1, 'Seçenek metni gereklidir'),
      is_correct: z.boolean()
    })).min(2, 'En az 2 seçenek gereklidir')
  })).min(1, 'En az 1 soru gereklidir')
});

export default function EditQuizPage() {  // EditQuizPage componenti
  const { courseId, lessonId, quizId } = useParams();  // Route parametrelerini al
  const router = useRouter();  // Router instance'ını al
  const [loading, setLoading] = useState(false);  // Loading durumunu kontrol et
  const [fetchingQuiz, setFetchingQuiz] = useState(true);  // Fetching quiz durumunu kontrol et
  const [error, setError] = useState<string | null>(null);  // Hata durumunu kontrol et
  const [quizNotFound, setQuizNotFound] = useState(false);  // Quiz bulunamadı durumunu kontrol et

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),  // Zod resolver için
    defaultValues: {  // Varsayılan değerler
      title: '',  // Title alanının varsayılan değeri
      description: '',  // Description alanının varsayılan değeri 
      time_limit: null,  // Time limit alanının varsayılan değeri
      passing_score: 60,  // Passing score alanının varsayılan değeri
      questions: [{  // Questions alanının varsayılan değeri
        question_text: '',  // Question text alanının varsayılan değeri
        points: 10,  // Points alanının varsayılan değeri
        options: [  // Options alanının varsayılan değeri
          { option_text: '', is_correct: false },  // Option text alanının varsayılan değeri
          { option_text: '', is_correct: false },  // Option text alanının varsayılan değeri
          { option_text: '', is_correct: false },  // Option text alanının varsayılan değeri
          { option_text: '', is_correct: false }  // Option text alanının varsayılan değeri
        ] 
      }]
    }  // Varsayılan değerler
  });

  // Mevcut quiz verilerini getir
  useEffect(() => {  // useEffect hook'u ile component mount edildiğinde veya dependency değiştiğinde çalışır
    const fetchQuizData = async () => {  // fetchQuizData fonksiyonu
      try {  // Try bloğu
        setFetchingQuiz(true);  // Fetching quiz durumunu true yap
        const response = await quizApi.getQuiz(  // Quiz verilerini al
          Number(courseId),  // Course ID'yi al
          Number(lessonId),  // Lesson ID'yi al
          Number(quizId)  // Quiz ID'yi al
        );
         
        // 404 hata kontrolü - ApiErrorResponse tipini kullan
        if ('error' in response && response.not_found) {  // ApiErrorResponse tipini kullan
          setQuizNotFound(true);  // Quiz bulunamadı durumunu true yap
          setError('Quiz bulunamadı');  // Hata mesajını göster
          setFetchingQuiz(false);  // Fetching quiz durumunu false yap
          return;  // Fonksiyonu sonlandır
        }
        
        // Formu mevcut verilerle doldur
        const quizData = response as Quiz;  // Quiz tipini kullan
        const formData = {  // Form verilerini al
          title: quizData.title,  // Title alanının değeri
          description: quizData.description,  // Description alanının değeri
          time_limit: quizData.time_limit,  // Time limit alanının değeri
          passing_score: quizData.passing_score,  // Passing score alanının değeri
          questions: quizData.questions.map((question: QuizQuestion) => ({  // QuizQuestion tipini kullan
            question_text: question.question_text,  // Question text alanının değeri
            points: question.points,  // Points alanının değeri
            options: question.options.map(option => ({  // Option tipini kullan
              option_text: option.option_text,  // Option text alanının değeri
              is_correct: option.is_correct  // Is correct alanının değeri
            }))
          })) 
        };
        
        reset(formData);  // Form verilerini reset et
      } catch (err) {  // Hata durumunda
        console.error('Error fetching quiz:', err);  // Hata mesajını konsola yazdır
        setError('Quiz yüklenirken bir hata oluştu');  // Hata mesajını göster
      } finally {
        setFetchingQuiz(false);  // Fetching quiz durumunu false yap
      }
    };

    fetchQuizData();  // fetchQuizData fonksiyonunu çağır
  }, [courseId, lessonId, quizId, reset]);

  const questions = watch('questions');  // Questions alanının değerini al

  const addQuestion = () => {  // addQuestion fonksiyonu
    setValue('questions', [...questions, {  // Questions alanının değerini güncelle
      question_text: '',  // Question text alanının değeri
      points: 10,  // Points alanının değeri
      options: [
        { option_text: '', is_correct: false },  // Option text alanının değeri
        { option_text: '', is_correct: false },  // Option text alanının değeri
        { option_text: '', is_correct: false },  // Option text alanının değeri
        { option_text: '', is_correct: false }  // Option text alanının değeri
      ] 
    }]);
  };

  const removeQuestion = (index: number) => {  // removeQuestion fonksiyonu
    const newQuestions = questions.filter((_, i) => i !== index);  // Questions alanının değerini güncelle
    setValue('questions', newQuestions);  // Questions alanının değerini güncelle
  };

  const onSubmit = async (data: QuizFormValues) => {  // onSubmit fonksiyonu
    try {  // Try bloğu
      setLoading(true);  // Loading durumunu true yap
      
      const transformedData = {  // Transform the data to match the backend API expectations
        ...data,  // Data'yı transform et
        questions: data.questions.map(question => ({  // Question tipini kullan
          ...question,  // Question tipini kullan
          options: question.options.map(option => ({  // Option tipini kullan
            text: option.option_text,  // Option text alanının değeri
            is_correct: option.is_correct  // Is correct alanının değeri
          }))
        }))
      };
      
      await quizApi.updateQuiz(  // Quiz'i güncelle
        Number(courseId),  // Course ID'yi al
        Number(lessonId),  // Lesson ID'yi al
        Number(quizId),  // Quiz ID'yi al
        transformedData 
      );
      router.push(`/courses/${courseId}/lessons/${lessonId}/quizzes`);  // Quiz'e geri dön
    } catch (err) {  // Hata durumunda
      console.error('Error updating quiz:', err);  // Hata mesajını konsola yazdır
      setError('Quiz güncellenirken bir hata oluştu');  // Hata mesajını göster
    } finally {
      setLoading(false);  // Loading durumunu false yap
    }
  };

  if (fetchingQuiz) {  // Fetching quiz durumunda
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (quizNotFound) {  // Quiz bulunamadı durumunda
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex flex-col items-center">
          <h2 className="text-xl font-bold mb-2">Quiz Bulunamadı</h2>
          <p className="mb-4">Aradığınız quiz sistemde bulunmuyor veya silinmiş olabilir.</p>
          <button
            onClick={() => router.push(`/courses/${courseId}/lessons/${lessonId}/quizzes`)}  // Quiz'e geri dön
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Quizlere Dön
          </button>
        </div>
      </div>
    );
  }

  return (  // Quiz'i düzenle
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Quiz Düzenle</h1>

        {error && (  // Hata durumunda
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">  // Form işleme için
          <div>
            <label className="block text-sm font-medium text-gray-700">Quiz Başlığı</label>
            <input
              {...register('title')}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
            {errors.title && (  // Hata durumunda
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div> 
            <label className="block text-sm font-medium text-gray-700">Açıklama</label>
            <textarea
              {...register('description')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Süre Limiti (dakika)</label>
              <input
                {...register('time_limit', { valueAsNumber: true })}
                type="number"
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Geçme Notu (%)</label>
              <input
                {...register('passing_score', { valueAsNumber: true })}
                type="number"
                min="0"
                max="100"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Sorular</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Soru Ekle
              </button>
            </div>

            {questions.map((_, questionIndex) => (
              <div key={questionIndex} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">Soru {questionIndex + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeQuestion(questionIndex)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Sil
                  </button>
                </div>

                <div>
                  <input
                    {...register(`questions.${questionIndex}.question_text`)}
                    placeholder="Soru metni"
                    className="w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>

                <div>
                  <input
                    {...register(`questions.${questionIndex}.points`, { valueAsNumber: true })}
                    type="number"
                    min="1"
                    placeholder="Puan"
                    className="w-32 rounded-md border-gray-300 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Seçenekler</h4>
                  {questions[questionIndex].options.map((_, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <input
                        {...register(`questions.${questionIndex}.options.${optionIndex}.option_text`)}
                        placeholder={`Seçenek ${optionIndex + 1}`}
                        className="flex-1 rounded-md border-gray-300 shadow-sm"
                      />
                      <input
                        type="radio"
                        name={`correct_${questionIndex}`}
                        onChange={() => {
                          // Her seçeneği güncelle - sadece seçilen doğru olacak
                          questions[questionIndex].options.forEach((_, idx) => {
                            setValue(
                              `questions.${questionIndex}.options.${idx}.is_correct`, 
                              idx === optionIndex
                            );
                          });
                        }}
                        // O anda seçili olan seçeneği kontrol et
                        checked={questions[questionIndex].options[optionIndex].is_correct}
                        className="h-4 w-4 text-blue-600"
                      />
                      <label className="text-sm text-gray-600">Doğru</label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Güncelleniyor...' : 'Quiz Güncelle'}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/courses/${courseId}/lessons/${lessonId}/quizzes`)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 