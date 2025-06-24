'use client';

import { useState, useEffect } from 'react';  // Client-side rendering için directive
import { useParams, useRouter } from 'next/navigation';  // Route parametrelerini almak için
import { useForm } from 'react-hook-form';  // Form işleme için
import { zodResolver } from '@hookform/resolvers/zod';  // Zod resolver için
import { z } from 'zod';  // Zod için
import { lessonApi } from '@/lib/api/lessons';  // Lesson API'sini içe aktar
import { Lesson, CreateLessonData } from '@/types/lesson';  // Lesson ve CreateLessonData tipini içe aktar
import { toast } from 'react-hot-toast';  // Toast mesajları için
import { BASE_URL } from '@/lib/api/index';  // BASE_URL'i içe aktar

const lessonSchema = z.object({  // Lesson şeması
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır'),  // Title alanı
  content: z.string().min(10, 'İçerik en az 10 karakter olmalıdır'),  // Content alanı
  order: z.number().min(1, 'Sıra numarası 1 veya daha büyük olmalıdır')  // Order alanı
});

type LessonFormData = CreateLessonData;  // LessonFormData tipi

export default function EditLessonPage() {  // EditLessonPage componenti
  const { courseId, lessonId } = useParams();  // Route parametrelerini al
  const router = useRouter();  // Router instance'ını al
  const [loading, setLoading] = useState(false);  // Loading durumunu kontrol et
  const [fetchLoading, setFetchLoading] = useState(true);  // Fetch loading durumunu kontrol et
  const [error, setError] = useState<string | null>(null);  // Hata durumunu kontrol et
  const [selectedFile, setSelectedFile] = useState<File | null>(null);  // Seçilen dosya
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);  // Mevcut ders

  const { register, handleSubmit, formState: { errors }, reset } = useForm<LessonFormData>({  // Form işleme için
    resolver: zodResolver(lessonSchema),  // Zod resolver için
    defaultValues: {  // Varsayılan değerler
      title: '',  // Title alanının varsayılan değeri
      content: '',  // Content alanının varsayılan değeri
      order: 1  // Order alanının varsayılan değeri
    }
  });

  const numericCourseId = Number(courseId);  // Course ID'yi al
  const numericLessonId = Number(lessonId);  // Lesson ID'yi al

  // Mevcut ders bilgilerini getir
  useEffect(() => {  // useEffect hook'u ile component mount edildiğinde veya dependency değiştiğinde çalışır
    const fetchLessonDetails = async () => {  // fetchLessonDetails fonksiyonu
      if (isNaN(numericCourseId) || isNaN(numericLessonId)) {  // Course ID veya Lesson ID geçersizse
        setError('Geçersiz Kurs ID veya Ders ID');  // Hata mesajını göster
        setFetchLoading(false);  // Fetch loading durumunu false yap
        return;  // Fonksiyonu sonlandır
      }

      try {  // Try bloğu
        const lessonData = await lessonApi.getLesson(numericCourseId, numericLessonId);  // Ders bilgilerini al
        setCurrentLesson(lessonData);  // Mevcut dersi güncelle
        
        // Form alanlarını doldur
        reset({
          title: lessonData.title,  // Title alanının değeri
          content: lessonData.content,  // Content alanının değeri
          order: lessonData.order  // Order alanının değeri
        });
      } catch (err) {  // Hata durumunda
        console.error('Error fetching lesson details:', err);  // Hata mesajını konsola yazdır
        setError('Ders bilgileri yüklenirken bir hata oluştu');  // Hata mesajını göster
      } finally {
        setFetchLoading(false);  // Fetch loading durumunu false yap
      }
    };

    fetchLessonDetails();  // fetchLessonDetails fonksiyonunu çağır
  }, [numericCourseId, numericLessonId, reset]);

  const onSubmit = async (data: LessonFormData) => {  // onSubmit fonksiyonu
    if (isNaN(numericCourseId) || isNaN(numericLessonId)) {  // Course ID veya Lesson ID geçersizse
      setError('Geçersiz Kurs ID veya Ders ID');  // Hata mesajını göster
      return;  // Fonksiyonu sonlandır
    }
  
    setLoading(true);  // Loading durumunu true yap
    setError(null);  // Hata mesajını null yap

    try {
      // Dersi güncelle
      const updatedLesson = await lessonApi.updateLesson(numericCourseId, numericLessonId, data);  // Dersi güncelle
      toast.success(`Ders '${updatedLesson.title}' güncellendi.`);  // Toast mesajı göster

      // Eğer yeni bir video seçilmişse, onu da yükle
      if (selectedFile) {
        const formData = new FormData();  // FormData instance'ını oluştur
        formData.append('video', selectedFile);  // Video dosyasını formData'ya ekle
        
        await lessonApi.uploadMedia(numericCourseId, numericLessonId, formData);  // Video dosyasını yükle
        toast.success(`Video '${selectedFile.name}' başarıyla yüklendi.`);  // Toast mesajı göster
      }

      // Dersler sayfasına geri dön
      router.push(`/courses/${courseId}/lessons`);  // Dersler sayfasına geri dön

    } catch (err: unknown) {  // Hata durumunda
      console.error('Error during lesson update or upload process:', err);  // Hata mesajını konsola yazdır
      const errorMessage = err instanceof Error ? err.message : String(err);  // Hata mesajını al
      setError(`Ders güncellenirken bir hata oluştu: ${errorMessage || 'Bilinmeyen hata'}`);  // Hata mesajını göster
    } finally {
      setLoading(false);  // Loading durumunu false yap
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {  // handleFileChange fonksiyonu
    const file = event.target.files?.[0];  // Seçilen dosya
    if (file) {  // Seçilen dosya varsa
      setSelectedFile(file);  // Seçilen dosyayı setSelectedFile'a ekle
      setError(null);  // Hata mesajını null yap
      console.log('File selected:', file.name);  // Seçilen dosyanın adını konsola yazdır
    } else {  // Seçilen dosya yoksa
      setSelectedFile(null);  // Seçilen dosyayı null yap
    }
  };

  if (fetchLoading) {  // Fetch loading durumunda
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Ders bilgileri yükleniyor...</div>
      </div>
    );
  }

  if (error && !currentLesson) {  // Hata durumunda ve mevcut ders yoksa
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button 
          onClick={() => router.back()}  // Geri dön 
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