'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { lessonApi } from '@/lib/api/lessons';
import { Lesson, CreateLessonData } from '@/types/lesson';
import { toast } from 'react-hot-toast';
import { BASE_URL } from '@/lib/api/index';

const lessonSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır'),
  content: z.string().min(10, 'İçerik en az 10 karakter olmalıdır'),
  order: z.number().min(1, 'Sıra numarası 1 veya daha büyük olmalıdır')
});

// UpdateLessonData için kullanılacak tip
type LessonFormData = CreateLessonData;

export default function EditLessonPage() {
  const { courseId, lessonId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: '',
      content: '',
      order: 1
    }
  });

  const numericCourseId = Number(courseId);
  const numericLessonId = Number(lessonId);

  // Mevcut ders bilgilerini getir
  useEffect(() => {
    const fetchLessonDetails = async () => {
      if (isNaN(numericCourseId) || isNaN(numericLessonId)) {
        setError('Geçersiz Kurs ID veya Ders ID');
        setFetchLoading(false);
        return;
      }

      try {
        const lessonData = await lessonApi.getLesson(numericCourseId, numericLessonId);
        setCurrentLesson(lessonData);
        
        // Form alanlarını doldur
        reset({
          title: lessonData.title,
          content: lessonData.content,
          order: lessonData.order
        });
      } catch (err) {
        console.error('Error fetching lesson details:', err);
        setError('Ders bilgileri yüklenirken bir hata oluştu');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchLessonDetails();
  }, [numericCourseId, numericLessonId, reset]);

  const onSubmit = async (data: LessonFormData) => {
    if (isNaN(numericCourseId) || isNaN(numericLessonId)) {
      setError('Geçersiz Kurs ID veya Ders ID');
      return;
    }
  
    setLoading(true);
    setError(null);

    try {
      // Dersi güncelle
      const updatedLesson = await lessonApi.updateLesson(numericCourseId, numericLessonId, data);
      toast.success(`Ders '${updatedLesson.title}' güncellendi.`);

      // Eğer yeni bir video seçilmişse, onu da yükle
      if (selectedFile) {
        const formData = new FormData();
        formData.append('video', selectedFile);
        
        await lessonApi.uploadMedia(numericCourseId, numericLessonId, formData);
        toast.success(`Video '${selectedFile.name}' başarıyla yüklendi.`);
      }

      // Dersler sayfasına geri dön
      router.push(`/courses/${courseId}/lessons`);

    } catch (err: unknown) {
      console.error('Error during lesson update or upload process:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Ders güncellenirken bir hata oluştu: ${errorMessage || 'Bilinmeyen hata'}`);
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

  if (fetchLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Ders bilgileri yükleniyor...</div>
      </div>
    );
  }

  if (error && !currentLesson) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button 
          onClick={() => router.back()} 
          className="mt-4 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Dersi Düzenle</h1>

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

          {currentLesson?.video_url && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mevcut Video</label>
              <video
                src={`${BASE_URL}${currentLesson.video_url}`}
                controls
                className="w-full rounded-md mb-2 max-h-48"
              />
              <p className="text-sm text-gray-500 mb-2">
                Yeni bir video yüklerseniz, mevcut video değiştirilecektir.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {currentLesson?.video_url ? 'Videoyu Değiştir (İsteğe bağlı)' : 'Video Ekle (İsteğe bağlı)'}
            </label>
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
              {loading ? 'Güncelleniyor...' : 'Dersi Güncelle'}
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
    </div>
  );
} 