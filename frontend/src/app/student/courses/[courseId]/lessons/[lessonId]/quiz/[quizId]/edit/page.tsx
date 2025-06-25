'use client';

import { useState, useEffect } from 'react'; //useState, useEffect için
import { useParams, useRouter } from 'next/navigation'; //useParams, useRouter için
import { useForm } from 'react-hook-form'; //useForm için
import { zodResolver } from '@hookform/resolvers/zod'; //zodResolver için
import { z } from 'zod'; //z için
import { quizApi, ApiErrorResponse } from '@/lib/api/quiz'; //quizApi, ApiErrorResponse için
import { Quiz, QuizQuestion } from '@/types/quiz'; //Quiz, QuizQuestion için

interface QuizFormValues { //QuizFormValues için
  title: string; //title için
  description: string; //description için
  time_limit: number | null; //time_limit için
  passing_score: number; //passing_score için
  questions: { //questions için
    question_text: string; //question_text için
    points: number; //points için
    options: { //options için
      option_text: string; //option_text için
      is_correct: boolean; //is_correct için
    }[];
  }[];
} //QuizFormValues için

const quizSchema = z.object({ //quizSchema için
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır'), //title için
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'), //description için
  time_limit: z.preprocess(
    // Boş stringi null olarak dön
    val => val === '' ? null : Number(val), //val için
    z.number().nullable()
  ),
  passing_score: z.number().min(0).max(100), //passing_score için
  questions: z.array(z.object({ //questions için
    question_text: z.string().min(1, 'Soru metni gereklidir'), //question_text için
    points: z.number().min(1, 'Puan 1 veya daha büyük olmalıdır'), //points için
    options: z.array(z.object({ //options için
      option_text: z.string().min(1, 'Seçenek metni gereklidir'), //option_text için
      is_correct: z.boolean() //is_correct için
    })).min(2, 'En az 2 seçenek gereklidir') //min için
  })).min(1, 'En az 1 soru gereklidir') //min için
}); //quizSchema için

export default function EditQuizPage() { //EditQuizPage için
  const { courseId, lessonId, quizId } = useParams(); //courseId, lessonId, quizId için
  const router = useRouter(); //router için
  const [loading, setLoading] = useState(false); //loading için
  const [fetchingQuiz, setFetchingQuiz] = useState(true); //fetchingQuiz için
  const [error, setError] = useState<string | null>(null); //error için
  const [quizNotFound, setQuizNotFound] = useState(false); //quizNotFound için

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<QuizFormValues>({ //register, handleSubmit, formState: { errors }, watch, setValue, reset için
    resolver: zodResolver(quizSchema), //zodResolver için
    defaultValues: { //defaultValues için
      title: '', //title için
      description: '', //description için
      time_limit: null, //time_limit için
      passing_score: 60, //passing_score için
      questions: [{ //questions için
        question_text: '', //question_text için
        points: 10, //points için
        options: [ //options için
          { option_text: '', is_correct: false }, 
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false }
        ] 
      }]
    }
  });

  // Mevcut quiz verilerini getir
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setFetchingQuiz(true);
        const response = await quizApi.getQuiz(
          Number(courseId), 
          Number(lessonId), 
          Number(quizId)
        );
        
        // 404 hata kontrolü - ApiErrorResponse tipini kullan
        if ('error' in response && response.not_found) {
          setQuizNotFound(true);
          setError('Quiz bulunamadı');
          setFetchingQuiz(false);
          return;
        }
        
        // Formu mevcut verilerle doldur
        const quizData = response as Quiz;
        const formData = {
          title: quizData.title,
          description: quizData.description,
          time_limit: quizData.time_limit,
          passing_score: quizData.passing_score,
          questions: quizData.questions.map((question: QuizQuestion) => ({
            question_text: question.question_text,
            points: question.points,
            options: question.options.map(option => ({
              option_text: option.option_text,
              is_correct: option.is_correct
            }))
          }))
        };
        
        reset(formData); //reset için
      } catch (err) { //err için
        console.error('Error fetching quiz:', err); //console.error için
        setError('Quiz yüklenirken bir hata oluştu'); //setError için
      } finally { //finally için
        setFetchingQuiz(false); //setFetchingQuiz için
      }
    }; //fetchQuizData için

    fetchQuizData(); //fetchQuizData için
  }, [courseId, lessonId, quizId, reset]); //courseId, lessonId, quizId, reset için

  const questions = watch('questions'); //questions için

  const addQuestion = () => {
    setValue('questions', [...questions, { 
      question_text: '',
      points: 10,
      options: [
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false }
      ] 
    }]);
  };

  const removeQuestion = (index: number) => { //removeQuestion için
    const newQuestions = questions.filter((_, i) => i !== index); //questions.filter için
    setValue('questions', newQuestions); //setValue için
  }; //removeQuestion için

  const onSubmit = async (data: QuizFormValues) => { //onSubmit için
    try { //try için
      setLoading(true); //setLoading için
      
      // Backend API beklediği formatta veri dönüştürme
      const transformedData = {
        ...data,
        questions: data.questions.map(question => ({
          ...question,
          options: question.options.map(option => ({
            text: option.option_text,
            is_correct: option.is_correct
          }))
        }))
      };
      
      await quizApi.updateQuiz(
        Number(courseId), 
        Number(lessonId), 
        Number(quizId), 
        transformedData
      );
      router.push(`/courses/${courseId}/lessons/${lessonId}/quizzes`);
    } catch (err) {
      console.error('Error updating quiz:', err);
      setError('Quiz güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingQuiz) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (quizNotFound) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex flex-col items-center">
          <h2 className="text-xl font-bold mb-2">Quiz Bulunamadı</h2>
          <p className="mb-4">Aradığınız quiz sistemde bulunmuyor veya silinmiş olabilir.</p>
          <button
            onClick={() => router.push(`/courses/${courseId}/lessons/${lessonId}/quizzes`)}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Quizlere Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Quiz Düzenle</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Quiz Başlığı</label>
          <input
            {...register('title')}
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          {errors.title && (
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
  );
} 