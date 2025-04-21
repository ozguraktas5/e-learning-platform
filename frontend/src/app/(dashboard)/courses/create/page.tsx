'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { coursesApi } from '@/lib/api/courses';

const courseSchema = z.object({
  title: z.string().min(3, 'Kurs başlığı en az 3 karakter olmalıdır'),
  description: z.string().min(10, 'Kurs açıklaması en az 10 karakter olmalıdır'),
  price: z.number().optional(),
  category: z.string().min(1, 'Kategori seçiniz'),
  level: z.string().min(1, 'Seviye seçiniz'),
});

type CourseFormData = z.infer<typeof courseSchema>;

const categories = [
  'Programlama',
  'Tasarım',
  'İşletme',
  'Pazarlama',
  'Kişisel Gelişim',
  'Müzik',
  'Fotoğrafçılık',
  'Diğer'
];

const levels = [
  'Başlangıç',
  'Orta',
  'İleri'
];

export default function CreateCoursePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
  });

  const onSubmit = async (data: CourseFormData) => {
    try {
      setIsLoading(true);
      await coursesApi.createCourse(data);
      toast.success('Kurs başarıyla oluşturuldu!');
      router.push('/courses');
    } catch (error: any) {
      if (error?.response?.status === 401) {
        toast.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
        router.push('/auth/login');
        return;
      }
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Kurs oluşturulurken bir hata oluştu';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Yeni Kurs Oluştur</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Kurs Başlığı
          </label>
          <input
            {...register('title')}
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Kurs Açıklaması
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Kategori
          </label>
          <select
            {...register('category')}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Kategori Seçin</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="level" className="block text-sm font-medium text-gray-700">
            Seviye
          </label>
          <select
            {...register('level')}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Seviye Seçin</option>
            {levels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          {errors.level && (
            <p className="mt-1 text-sm text-red-600">{errors.level.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Fiyat (Opsiyonel)
          </label>
          <input
            {...register('price', { valueAsNumber: true })}
            type="number"
            step="0.01"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Oluşturuluyor...' : 'Kurs Oluştur'}
          </button>
        </div>
      </form>
    </div>
  );
}