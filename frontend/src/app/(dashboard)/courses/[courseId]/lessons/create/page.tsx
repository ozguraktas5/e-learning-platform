'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { lessonApi } from '@/lib/api/lessons';
import { CreateLessonData } from '@/types/lesson';

const lessonSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır'),
  content: z.string().min(10, 'İçerik en az 10 karakter olmalıdır'),
  order: z.number().min(1, 'Sıra numarası 1 veya daha büyük olmalıdır')
});

export default function CreateLessonPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateLessonData>({
    resolver: zodResolver(lessonSchema)
  });

  const onSubmit = async (data: CreateLessonData) => {
    try {
      setLoading(true);
      const lesson = await lessonApi.createLesson(Number(courseId), data);
      router.push(`/courses/${courseId}/lessons/${lesson.id}`);
    } catch (err) {
      setError('Ders oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadProgress(0);
      const response = await lessonApi.uploadMedia(Number(courseId), 0, formData);
      // Dosya yükleme başarılı
      setUploadProgress(100);
    } catch (err) {
      setError('Dosya yüklenirken bir hata oluştu');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Yeni Ders Oluştur</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700">Başlık</label>
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
          <label className="block text-sm font-medium text-gray-700">İçerik</label>
          <textarea
            {...register('content')}
            rows={6}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Sıra</label>
          <input
            {...register('order', { valueAsNumber: true })}
            type="number"
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          {errors.order && (
            <p className="mt-1 text-sm text-red-600">{errors.order.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Video</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            className="mt-1 block w-full"
          />
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-2 h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Oluşturuluyor...' : 'Ders Oluştur'}
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