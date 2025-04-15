'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { courseApi } from '@/lib/api/courses';
import { UpdateCourseData } from '@/types/course';

const updateCourseSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır'),
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'),
  category: z.string().min(1, 'Kategori seçiniz'),
  level: z.string().min(1, 'Seviye seçiniz'),
  price: z.number().min(0, 'Fiyat 0 veya daha yüksek olmalıdır')
});

export default function EditCoursePage() {
  const { courseId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UpdateCourseData>({
    resolver: zodResolver(updateCourseSchema)
  });

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const course = await courseApi.getCourse(Number(courseId));
      reset(course); // Form alanlarını mevcut kurs bilgileriyle doldur
    } catch (err) {
      setError('Kurs bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: UpdateCourseData) => {
    try {
      setLoading(true);
      await courseApi.updateCourse(Number(courseId), data);
      router.push(`/courses/${courseId}`);
    } catch (err) {
      setError('Kurs güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Yükleniyor...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Kurs Düzenle</h1>

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
          <label className="block text-sm font-medium text-gray-700">Açıklama</label>
          <textarea
            {...register('description')}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Kategori</label>
          <select
            {...register('category')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="">Seçiniz</option>
            <option value="programming">Programlama</option>
            <option value="design">Tasarım</option>
            <option value="business">İş</option>
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Seviye</label>
          <select
            {...register('level')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="">Seçiniz</option>
            <option value="beginner">Başlangıç</option>
            <option value="intermediate">Orta</option>
            <option value="advanced">İleri</option>
          </select>
          {errors.level && (
            <p className="mt-1 text-sm text-red-600">{errors.level.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fiyat</label>
          <input
            {...register('price', { valueAsNumber: true })}
            type="number"
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
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