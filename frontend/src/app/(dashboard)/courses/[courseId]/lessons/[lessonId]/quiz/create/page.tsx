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
  time_limit: z.number().nullable(),
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

export default function CreateQuizPage() {
  const { courseId, lessonId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      questions: [{ options: [{}, {}, {}, {}] }]
    }
  });

  const questions = watch('questions');

  const addQuestion = () => {
    setValue('questions', [...questions, { options: [{}, {}, {}, {}] }]);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setValue('questions', newQuestions);
  };

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      await quizApi.createQuiz(Number(courseId), Number(lessonId), data);
      router.push(`/courses/${courseId}/lessons/${lessonId}`);
    } catch (err) {
      setError('Quiz oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Yeni Quiz Oluştur</h1>

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
                      {...register(`questions.${questionIndex}.options.${optionIndex}.is_correct`)}
                      type="radio"
                      name={`correct_${questionIndex}`}
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
            {loading ? 'Oluşturuluyor...' : 'Quiz Oluştur'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  );
}