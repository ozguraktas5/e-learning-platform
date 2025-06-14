'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { assignmentsApi } from '@/lib/api/assignments';

// Form şeması
const assignmentSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır'),
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'),
  due_date: z.string().refine(val => {
    try {
      const date = new Date(val);
      return date > new Date();
    } catch {
      return false;
    }
  }, { message: 'Son teslim tarihi gelecekte bir tarih olmalıdır' }),
  max_points: z.number().min(1, 'Maksimum puan 1 veya daha büyük olmalıdır')
});

// Form değerleri için tip
type AssignmentFormValues = z.infer<typeof assignmentSchema>;

export default function CreateAssignmentPage() {
  const { courseId, lessonId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // React Hook Form
  const { register, handleSubmit, formState: { errors } } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      due_date: '',
      max_points: 100
    }
  });

  // Form gönderimi
  const onSubmit = async (data: AssignmentFormValues) => {
    try {
      setLoading(true);
      
      // API'ye gönderilecek veriyi hazırla
      const assignmentData = {
        title: data.title,
        description: data.description,
        due_date: new Date(data.due_date).toISOString(),
        max_points: data.max_points
      };
      
      // API'ye gönder
      await assignmentsApi.createAssignment(
        Number(courseId),
        Number(lessonId),
        assignmentData
      );
      
      toast.success('Ödev başarıyla oluşturuldu!');
      router.push(`/courses/${courseId}/lessons/${lessonId}/assignments`);
    } catch (err) {
      console.error('Error creating assignment:', err);
      setError('Ödev oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Minimum tarih belirleme (bugün)
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const minDate = today.toISOString().slice(0, 16); // format: YYYY-MM-DDThh:mm

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Yeni Ödev Oluştur</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

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

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push(`/courses/${courseId}/lessons/${lessonId}/assignments`)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Oluşturuluyor...' : 'Ödevi Oluştur'}
          </button>
        </div>
      </form>
    </div>
  );
} 