'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { lessonApi } from '@/lib/api/lessons';
import { CreateLessonData, Lesson } from '@/types/lesson';
import { toast } from 'react-hot-toast';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateLessonData>({
    resolver: zodResolver(lessonSchema)
  });

  const numericCourseId = Number(courseId);

  const onSubmit = async (data: CreateLessonData) => {
    if (isNaN(numericCourseId)) {
      setError('Geçersiz Kurs ID');
      return;
    }
  
    setLoading(true);
    setError(null);
    let newLesson: Lesson | null = null;

    try {
      newLesson = await lessonApi.createLesson(numericCourseId, data);
      toast.success(`Ders '${newLesson.title}' oluşturuldu.`);

      if (selectedFile && newLesson && newLesson.id) {
        const formData = new FormData();
        formData.append('video', selectedFile);
        
        await lessonApi.uploadMedia(numericCourseId, newLesson.id, formData);
        toast.success(`Video '${selectedFile.name}' başarıyla yüklendi.`);
      }

      router.push(`/courses/${courseId}/lessons`);

    } catch (err: unknown) {
      console.error('Error during lesson creation or upload process:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Ders oluşturulurken bir hata oluştu: ${errorMessage || 'Bilinmeyen hata'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      console.log('File selected:', file.name);
    } else {
      setSelectedFile(null);
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">İçerik (HTML destekler)</label>
          <textarea
            {...register('content')}
            rows={6}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {errors.order && (
            <p className="mt-1 text-sm text-red-600">{errors.order.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Video (İsteğe bağlı)</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {selectedFile && (
             <p className="mt-1 text-sm text-green-600">Seçilen dosya: {selectedFile.name}</p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition duration-150 ease-in-out"
          >
            {loading ? 'Oluşturuluyor...' : 'Ders Oluştur'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-150 ease-in-out"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  );
}