'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { assignmentsApi, CreateAssignmentData } from '@/lib/api/assignments';
import { coursesApi } from '@/lib/api/courses';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const assignmentSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır'),
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'),
  due_date: z.string().min(1, 'Son teslim tarihi gerekli'),
  total_points: z.number().min(1, 'Puan 1 veya daha büyük olmalıdır')
});

export default function CreateAssignmentPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<CreateAssignmentData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      due_date: new Date().toISOString().split('T')[0],
      total_points: 100
    }
  });

  const numericCourseId = Number(courseId);

  const onSubmit = async (data: CreateAssignmentData) => {
    if (isNaN(numericCourseId)) {
      setError('Geçersiz Kurs ID');
      return;
    }
  
    setLoading(true);
    setError(null);

    try {
      const newAssignment = await assignmentsApi.createAssignment(numericCourseId, data);
      toast.success(`Ödev '${newAssignment.title}' oluşturuldu.`);
      router.push(`/instructor/courses/${courseId}/assignments`);
    } catch (err: unknown) {
      console.error('Error during assignment creation:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Ödev oluşturulurken bir hata oluştu: ${errorMessage || 'Bilinmeyen hata'}`);
    } finally {
      setLoading(false);
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
            <h1 className="text-3xl font-bold mb-2">Yeni Ödev Oluştur</h1>
            <p className="text-gray-600">Kursa yeni bir ödev ekleyin</p>
          </div>
          <Link 
            href={`/instructor/courses/${courseId}/assignments`}
            className="text-gray-600 hover:text-gray-800 flex items-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Ödevlere Dön
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
                placeholder="Ödevin başlığını girin"
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
              <textarea
                {...register('description')}
                rows={8}
                placeholder="Ödev açıklamasını girin"
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.description && (
                <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Son Teslim Tarihi</label>
                <input
                  {...register('due_date')}
                  type="date"
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.due_date && (
                  <p className="mt-2 text-sm text-red-600">{errors.due_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Toplam Puan</label>
                <input
                  {...register('total_points', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  placeholder="100"
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.total_points && (
                  <p className="mt-2 text-sm text-red-600">{errors.total_points.message}</p>
                )}
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
                {loading ? 'Oluşturuluyor...' : 'Ödev Oluştur'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 