'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { lessonApi } from '@/lib/api/lessons';
import { CreateLessonData, Lesson } from '@/types/lesson';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<CreateLessonData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: '',
      content: '',
      order: 1
    }
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

      router.push(`/instructor/courses/${courseId}/lessons`);

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

  if (loading) {
    return <LoadingSpinner size="medium" fullScreen />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Yeni Ders Oluştur</h1>
            <p className="text-gray-600">Kursa yeni bir ders ekleyin</p>
          </div>
          <Link 
            href={`/instructor/courses/${courseId}/lessons`}
            className="text-gray-600 hover:text-gray-800 flex items-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Derslere Dön
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-red-500 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Başlık</label>
              <input
                {...register('title')}
                type="text"
                placeholder="Dersin başlığını girin"
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">İçerik</label>
              <textarea
                {...register('content')}
                rows={8}
                placeholder="Ders içeriğini girin (HTML destekler)"
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.content && (
                <p className="mt-2 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sıra Numarası</label>
              <input
                {...register('order', { valueAsNumber: true })}
                type="number"
                min="1"
                placeholder="1"
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.order && (
                <p className="mt-2 text-sm text-red-600">{errors.order.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Video (İsteğe bağlı)</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                <div className="space-y-2 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-12 w-12 text-gray-400">
                    <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="video-upload" className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500">
                      <span>Video yükle</span>
                      <input
                        id="video-upload"
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">veya sürükleyip bırakın</p>
                  </div>
                  <p className="text-xs text-gray-500">MP4, WebM veya Ogg</p>
                  {selectedFile && (
                    <div className="mt-4 text-sm text-blue-600 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {selectedFile.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                İptal
              </button>
              <button
                type="submit"
                disabled={!isDirty || loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {loading ? 'Oluşturuluyor...' : 'Ders Oluştur'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}