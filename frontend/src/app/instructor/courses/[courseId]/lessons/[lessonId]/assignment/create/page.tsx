'use client';

import { useState } from 'react';  // Client-side rendering için directive
import { useParams, useRouter } from 'next/navigation';  // Route parametrelerini almak için
import { useForm } from 'react-hook-form';  // Form işleme için
import { zodResolver } from '@hookform/resolvers/zod';  // Zod resolver için
import { z } from 'zod';  // Zod için
import { toast } from 'react-hot-toast';  // Toast mesajları için
import { assignmentsApi } from '@/lib/api/assignments';  // Assignment API'sini içe aktar

// Form şeması
const assignmentSchema = z.object({  // Assignment şeması
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır'),  // Title alanı
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'),  // Description alanı
  due_date: z.string().refine(val => {  // Due date alanı
    try {
      const date = new Date(val);  // Tarihi al
      return date > new Date();  // Tarih gelecekte mi
    } catch {  // Hata durumunda
      return false;  // False döndür
    }
  }, { message: 'Son teslim tarihi gelecekte bir tarih olmalıdır' }), 
  max_points: z.number().min(1, 'Maksimum puan 1 veya daha büyük olmalıdır')  // Max points alanı
});

// Form değerleri için tip
type AssignmentFormValues = z.infer<typeof assignmentSchema>;  // AssignmentFormValues tipi

export default function CreateAssignmentPage() {  // CreateAssignmentPage componenti
  const { courseId, lessonId } = useParams();  // Route parametrelerini al
  const router = useRouter();  // Router instance'ını al
  const [loading, setLoading] = useState(false);  // Loading durumunu kontrol et
  const [error, setError] = useState<string | null>(null);  // Hata durumunu kontrol et

  // React Hook Form
  const { register, handleSubmit, formState: { errors } } = useForm<AssignmentFormValues>({  // Form işleme için
    resolver: zodResolver(assignmentSchema),  // Zod resolver için
    defaultValues: {  // Varsayılan değerler
      title: '',  // Title alanının varsayılan değeri
      description: '',  // Description alanının varsayılan değeri
      due_date: '',  // Due date alanının varsayılan değeri
      max_points: 100  // Max points alanının varsayılan değeri
    }
  });

  // Form gönderimi
  const onSubmit = async (data: AssignmentFormValues) => {  // onSubmit fonksiyonu
    try {  // Try bloğu
      setLoading(true);  // Loading durumunu true yap
      
      // API'ye gönderilecek veriyi hazırla
      const assignmentData = {  // Assignment data
        title: data.title,  // Title alanının değeri
        description: data.description,  // Description alanının değeri
        due_date: new Date(data.due_date).toISOString(),  // Due date alanının değeri
        max_points: data.max_points,  // Max points alanının değeri
        lesson_id: Number(lessonId)  // Lesson ID'yi al
      };
      
      // API'ye gönder
      await assignmentsApi.createAssignment(  // Assignment API'sini çağır
        Number(courseId),  // Course ID'yi al
        assignmentData  // Assignment data
      );
      
      toast.success('Ödev başarıyla oluşturuldu!');  // Toast mesajı göster
      router.push(`/instructor/courses/${courseId}/lessons/${lessonId}/assignments`);  // Router'ı güncelle
    } catch (err) {  // Hata durumunda
      console.error('Error creating assignment:', err);  // Hata mesajını konsola yazdır
      setError('Ödev oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');  // Hata mesajını göster
    } finally {
      setLoading(false);  // Loading durumunu false yap
    }
  };

  // Minimum tarih belirleme (bugün)
  const today = new Date();  // Bugünü al
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());  // Saat dilimini ayarla
  const minDate = today.toISOString().slice(0, 16);  // format: YYYY-MM-DDThh:mm

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Yeni Ödev Oluştur</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ödev Başlığı
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ödev başlığını girin"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  {...register('description')}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ödev açıklamasını ve gereksinimlerini ayrıntılı bir şekilde yazın"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Son Teslim Tarihi
                  </label>
                  <input
                    {...register('due_date')}
                    type="datetime-local"
                    min={minDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.due_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maksimum Puan
                  </label>
                  <input
                    {...register('max_points', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.max_points && (
                    <p className="mt-1 text-sm text-red-600">{errors.max_points.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.push(`/instructor/courses/${courseId}/lessons/${lessonId}/assignments`)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Oluşturuluyor...' : 'Ödevi Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 