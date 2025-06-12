'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { coursesApi } from '@/lib/api/courses';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Form validation schema
const courseSchema = z.object({
  title: z.string().min(3, 'Kurs başlığı en az 3 karakter olmalıdır'),
  description: z.string().min(10, 'Kurs açıklaması en az 10 karakter olmalıdır'),
  price: z.number().min(0, 'Fiyat 0\'dan küçük olamaz'),
  category: z.string().min(1, 'Kategori seçmelisiniz'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  image_url: z.string().url('Geçerli bir resim URL\'si giriniz').optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

const categories = [
  'Programlama',
  'Veri Bilimi',
  'Web Geliştirme',
  'Mobil Uygulama',
  'Yapay Zeka',
  'Siber Güvenlik',
  'Veritabanı',
  'DevOps',
  'UI/UX Tasarım',
  'Oyun Geliştirme'
];

export default function CreateCoursePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      price: 0,
      level: 'beginner'
    }
  });

  const onSubmit = async (data: CourseFormData) => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('level', data.level);
      formData.append('price', data.price.toString());
      if (data.image_url) {
        formData.append('image_url', data.image_url);
      }
      await coursesApi.createCourse(formData);
      toast.success('Kurs başarıyla oluşturuldu!');
      router.push('/instructor/courses');
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Kurs oluşturulurken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) {
    return <LoadingSpinner size="large" fullScreen />;
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Yeni Kurs Oluştur</h1>
          <Link
            href="/instructor/courses"
            className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Kurslara Dön
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kurs Başlığı
              </label>
              <input
                {...register('title')}
                type="text"
                placeholder="Kurs başlığını girin"
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kurs Açıklaması
              </label>
              <textarea
                {...register('description')}
                rows={6}
                placeholder="Kurs açıklamasını girin"
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.description && (
                <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <select
                  {...register('category')}
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Kategori seçin</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-2 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seviye
                </label>
                <select
                  {...register('level')}
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="beginner">Başlangıç</option>
                  <option value="intermediate">Orta</option>
                  <option value="advanced">İleri</option>
                </select>
                {errors.level && (
                  <p className="mt-2 text-sm text-red-600">{errors.level.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fiyat (TL)
                </label>
                <input
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.price && (
                  <p className="mt-2 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kapak Resmi URL (Opsiyonel)
                </label>
                <input
                  {...register('image_url')}
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.image_url && (
                  <p className="mt-2 text-sm text-red-600">{errors.image_url.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Link
                href="/instructor/courses"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {submitting ? 'Oluşturuluyor...' : 'Kursu Oluştur'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}