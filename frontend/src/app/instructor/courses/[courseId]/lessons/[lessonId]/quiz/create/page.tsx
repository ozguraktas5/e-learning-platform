'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { quizApi } from '@/lib/api/quiz';

const quizSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır'),
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'),
  time_limit: z.preprocess(
    // Convert empty string to null
    val => val === '' ? null : Number(val),
    z.number().nullable()
  ),
  passing_score: z.number().min(0).max(100),
  questions: z.array(z.object({
    question_text: z.string().min(1, 'Soru metni gereklidir'),
    points: z.number().min(1, 'Puan 1 veya daha büyük olmalıdır'),
    options: z.array(z.object({
      option_text: z.string().min(1, 'Seçenek metni gereklidir'),
      is_correct: z.boolean()
    })).min(2, 'En az 2 seçenek gereklidir')
  })).min(1, 'En az 1 soru gereklidir')
});

interface QuizFormValues {
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

export default function CreateQuizPage() {
  const { courseId, lessonId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: '',
      description: '',
      time_limit: null,
      passing_score: 60,
      questions: [{ 
        question_text: '',
        points: 10,
        options: [
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false }
        ] 
      }]
    }
  });

  const questions = watch('questions');

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

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setValue('questions', newQuestions);
  };

  const onSubmit = async (data: QuizFormValues) => {
    try {
      setLoading(true);
      setError(null);
      
      // Transform the data to match the backend API expectations
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
      
      const result = await quizApi.createQuiz(Number(courseId), Number(lessonId), transformedData);
      
      // Check if result is an error response
      if ('error' in result) {
        setError(result.error);
        return;
      }
      
      // Başarılı oluşturma sonrası ders sayfasına yönlendir
      router.push(`/instructor/courses/${courseId}/lessons/${lessonId}`);
    } catch (err) {
      console.error('Error creating quiz:', err);
      setError('Quiz oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Yeni Quiz Oluştur</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Quiz Başlığı</label>
                <input
                  {...register('title')}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Süre Limiti (dakika)</label>
                  <input
                    {...register('time_limit', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Geçme Notu (%)</label>
                  <input
                    {...register('passing_score', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="100"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Sorular</h2>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Soru Ekle
                  </button>
                </div>

                {questions.map((_, questionIndex) => (
                  <div key={questionIndex} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">Soru {questionIndex + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeQuestion(questionIndex)}
                        className="text-red-600 hover:text-red-800 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Sil
                      </button>
                    </div>

                    <div>
                      <input
                        {...register(`questions.${questionIndex}.question_text`)}
                        placeholder="Soru metni"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <input
                        {...register(`questions.${questionIndex}.points`, { valueAsNumber: true })}
                        type="number"
                        min="1"
                        placeholder="Puan"
                        className="w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Seçenekler</h4>
                      {questions[questionIndex].options.map((_, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <input
                            {...register(`questions.${questionIndex}.options.${optionIndex}.option_text`)}
                            placeholder={`Seçenek ${optionIndex + 1}`}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                          <input
                            type="radio"
                            onChange={() => {
                              questions[questionIndex].options.forEach((_, idx) => {
                                setValue(
                                  `questions.${questionIndex}.options.${idx}.is_correct`, 
                                  idx === optionIndex
                                );
                              });
                            }}
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

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => router.push(`/instructor/courses/${courseId}/lessons/${lessonId}`)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Oluşturuluyor...' : 'Quiz Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}