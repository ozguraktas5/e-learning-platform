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
import { ArrowLeft, BookOpen, Plus, Upload, AlertTriangle, CheckCircle } from 'lucide-react';

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

      router.push(`/student/courses/${courseId}/lessons`);

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-indigo-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href={`/student/courses/${courseId}/lessons`}
                  className="p-2 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-indigo-600" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Yeni Ders Oluştur
                  </h1>
                  <p className="text-gray-600 mt-1">Kursa yeni bir ders ekleyin</p>
                </div>
              </div>
              <BookOpen className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <div className="backdrop-blur-sm bg-red-50/90 border border-red-200 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-indigo-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ders Başlığı *
              </label>
              <input
                {...register('title')}
                type="text"
                placeholder="Ders başlığını girin..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Content Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ders İçeriği *
              </label>
              <textarea
                {...register('content')}
                rows={8}
                placeholder="Ders içeriğini girin... (HTML destekler)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none"
              />
              {errors.content && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {errors.content.message}
                </p>
              )}
            </div>

            {/* Order Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sıra Numarası *
              </label>
              <input
                {...register('order', { valueAsNumber: true })}
                type="number"
                min="1"
                placeholder="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
              {errors.order && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {errors.order.message}
                </p>
              )}
            </div>

            {/* Video Upload Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Video Dosyası (İsteğe bağlı)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="w-full flex items-center justify-center gap-3 px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                >
                  <Upload className="h-6 w-6 text-gray-400" />
                  <div className="text-center">
                    <p className="text-gray-600 font-medium">
                      {selectedFile ? 'Dosyayı değiştirmek için tıklayın' : 'Video dosyası seçin'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      MP4, AVI, MOV formatları desteklenir
                    </p>
                  </div>
                </label>
              </div>
              
              {selectedFile && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Dosya seçildi:</p>
                      <p className="text-sm text-green-700">{selectedFile.name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Ders Oluştur
                  </>
                )}
              </button>
              <Link
                href={`/student/courses/${courseId}/lessons`}
                className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                İptal
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}