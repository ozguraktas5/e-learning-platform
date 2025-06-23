'use client';

import { useState, useEffect } from 'react';  // React'ten useState ve useEffect'i içe aktarır.
import { useParams, useRouter } from 'next/navigation';  // Next.js'ten useParams ve useRouter'u içe aktarır.
import { useForm } from 'react-hook-form';  // react-hook-form'tan useForm'u içe aktarır.
import { zodResolver } from '@hookform/resolvers/zod';  // @hookform/resolvers/zod'tan zodResolver'u içe aktarır.
import { z } from 'zod';  // zod'tan z'yi içe aktarır.
import { assignmentsApi, CreateAssignmentData } from '@/lib/api/assignments';  // @/lib/api/assignments'tan assignmentsApi ve CreateAssignmentData'yı içe aktarır.
import { coursesApi } from '@/lib/api/courses';  // @/lib/api/courses'tan coursesApi'yi içe aktarır.
import { toast } from 'react-hot-toast';  // react-hot-toast'tan toast'u içe aktarır.
import Link from 'next/link';  // Next.js'ten Link'i içe aktarır.
import LoadingSpinner from '@/components/ui/LoadingSpinner';  // @/components/ui/LoadingSpinner'tan LoadingSpinner'u içe aktarır.

interface Lesson {  // Lesson interface'ini oluşturur.
  id: number;  // id değişkenini oluşturur ve number tipinde bir değişken ile başlatır.
  title: string;  // title değişkenini oluşturur ve string tipinde bir değişken ile başlatır.
}

const assignmentSchema = z.object({  // assignmentSchema değişkenini oluşturur ve zod'tan z.object fonksiyonunu çağırır.
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır'),  // title değişkenini oluşturur ve zod'tan z.string fonksiyonunu çağırır.
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'),  // description değişkenini oluşturur ve zod'tan z.string fonksiyonunu çağırır.
  due_date: z.string().min(1, 'Son teslim tarihi gerekli'),  // due_date değişkenini oluşturur ve zod'tan z.string fonksiyonunu çağırır.
  max_points: z.number().min(1, 'Puan 1 veya daha büyük olmalıdır'),  // max_points değişkenini oluşturur ve zod'tan z.number fonksiyonunu çağırır.
  lesson_id: z.number().min(1, 'Ders seçimi zorunludur')  // lesson_id değişkenini oluşturur ve zod'tan z.number fonksiyonunu çağırır.
});

export default function CreateAssignmentPage() {  // CreateAssignmentPage bileşenini dışa aktarır.
  const { courseId } = useParams();  // useParams fonksiyonunu çağırır ve courseId değişkenini alır.
  const router = useRouter();  // useRouter fonksiyonunu çağırır ve router değişkenini alır.
  const [loading, setLoading] = useState(false);  // loading değişkenini oluşturur ve false ile başlatır.
  const [error, setError] = useState<string | null>(null);  // error değişkenini oluşturur ve string tipinde bir değişken ile başlatır.
  const [lessons, setLessons] = useState<Lesson[]>([]);  // lessons değişkenini oluşturur ve Lesson tipinde bir dizi ile başlatır.

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<CreateAssignmentData & { lesson_id: number }>({  // useForm fonksiyonunu çağırır ve CreateAssignmentData ve { lesson_id: number } tipinde bir değişken ile başlatır.
    resolver: zodResolver(assignmentSchema),  // zodResolver fonksiyonunu çağırır ve assignmentSchema'yi parametre olarak alır.
    defaultValues: {
      title: '',  // title değişkenini oluşturur ve '' ile başlatır. 
      description: '',  // description değişkenini oluşturur ve '' ile başlatır.
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),  // due_date değişkenini oluşturur ve new Date fonksiyonunu çağırır.
      max_points: 100,  // max_points değişkenini oluşturur ve 100 ile başlatır.
      lesson_id: 0  // lesson_id değişkenini oluşturur ve 0 ile başlatır.
    }
  });

  const numericCourseId = Number(courseId);  // numericCourseId değişkenini oluşturur ve courseId değişkenini Number fonksiyonu ile integer'a çevirir.

  useEffect(() => {  // useEffect fonksiyonunu çağırır.
    const fetchLessons = async () => {  // fetchLessons fonksiyonunu oluşturur.
      try {
        const response = await coursesApi.getCourseLessons(numericCourseId);  // coursesApi'den getCourseLessons fonksiyonunu çağırır ve numericCourseId değişkenini parametre olarak alır.
        setLessons(response);  // setLessons fonksiyonunu çağırır ve response değişkenini parametre olarak alır.
      } catch (err) {  // catch bloğunu oluşturur.
        console.error('Error fetching lessons:', err);  // console.error fonksiyonunu çağırır ve 'Error fetching lessons:' ile birlikte err'i yazdırır.
        setError('Dersler yüklenirken bir hata oluştu');  // setError fonksiyonunu çağırır ve 'Dersler yüklenirken bir hata oluştu' ile başlatır.
      }
    };

    if (!isNaN(numericCourseId)) {  // numericCourseId değişkeni NaN değilse
      fetchLessons();  // fetchLessons fonksiyonunu çağırır.
    }
  }, [numericCourseId]);  // useEffect fonksiyonunu çağırır.

  const onSubmit = async (data: CreateAssignmentData & { lesson_id: number }) => {  // onSubmit fonksiyonunu oluşturur ve data değişkenini alır.
    if (isNaN(numericCourseId)) {  // numericCourseId değişkeni NaN değilse
      setError('Geçersiz Kurs ID');  // setError fonksiyonunu çağırır ve 'Geçersiz Kurs ID' ile başlatır.
      return;  // return fonksiyonunu çağırır.
    }

    if (!data.lesson_id) {  // data.lesson_id değişkeni yoksa 
      setError('Lütfen bir ders seçin');  // setError fonksiyonunu çağırır ve 'Lütfen bir ders seçin' ile başlatır.
      return;  // return fonksiyonunu çağırır.
    }
  
    setLoading(true);  // setLoading fonksiyonunu çağırır ve true ile başlatır.
    setError(null);  // setError fonksiyonunu çağırır ve null ile başlatır.

    try {  // try bloğunu oluşturur.
      const newAssignment = await assignmentsApi.createAssignment(numericCourseId, {  // assignmentsApi'den createAssignment fonksiyonunu çağırır ve numericCourseId değişkenini ve data değişkenini parametre olarak alır.
        ...data,  // data değişkenini spread operatörü ile eklemektedir.
        lesson_id: Number(data.lesson_id)  // data.lesson_id değişkenini Number fonksiyonu ile integer'a çevirir.
      });
      toast.success(`Ödev '${newAssignment.title}' oluşturuldu.`);  // toast.success fonksiyonunu çağırır ve 'Ödev '${newAssignment.title}' oluşturuldu.' ile başlatır.
      router.push(`/instructor/courses/${courseId}/assignments`);  // router.push fonksiyonunu çağırır ve '/instructor/courses/${courseId}/assignments' ile yönlendirir.
    } catch (err: unknown) {  // catch bloğunu oluşturur.
      console.error('Error during assignment creation:', err);  // console.error fonksiyonunu çağırır ve 'Error during assignment creation:' ile birlikte err'i yazdırır.
      const errorMessage = err instanceof Error ? err.message : String(err);  // errorMessage değişkenini oluşturur ve err değişkeni Error tipinde ise err.message değişkenini, değilse err değişkenini String fonksiyonu ile string'e çevirir.
      setError(`Ödev oluşturulurken bir hata oluştu: ${errorMessage || 'Bilinmeyen hata'}`);  // setError fonksiyonunu çağırır ve 'Ödev oluşturulurken bir hata oluştu: ${errorMessage || 'Bilinmeyen hata'}' ile başlatır.
    } finally {  // finally bloğunu oluşturur.
      setLoading(false);  // setLoading fonksiyonunu çağırır ve false ile başlatır.
    }
  };

  if (loading) {  // loading değişkeni true ise
    return <LoadingSpinner size="medium" fullScreen />;  // LoadingSpinner bileşenini döndürür.
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mx-auto">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Ders</label>
              <select
                {...register('lesson_id', { valueAsNumber: true })}
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>Ders Seçin</option>
                {lessons.map(lesson => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
              {errors.lesson_id && (
                <p className="mt-2 text-sm text-red-600">{errors.lesson_id.message}</p>
              )}
            </div>

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
                  type="datetime-local"
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.due_date && (
                  <p className="mt-2 text-sm text-red-600">{errors.due_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Toplam Puan</label>
                <input
                  {...register('max_points', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  placeholder="100"
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.max_points && (
                  <p className="mt-2 text-sm text-red-600">{errors.max_points.message}</p>
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