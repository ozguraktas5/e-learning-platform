'use client';

import { useState } from 'react'; //useState için
import { useParams, useRouter } from 'next/navigation'; //useParams, useRouter için
import { useForm } from 'react-hook-form'; //useForm için
import { zodResolver } from '@hookform/resolvers/zod'; //zodResolver için
import { z } from 'zod'; //z için
import { toast } from 'react-hot-toast'; //toast için
import { assignmentsApi } from '@/lib/api/assignments'; //assignmentsApi için

// Form şeması
const assignmentSchema = z.object({ //assignmentSchema için
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır'), //title için
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'), //description için
  due_date: z.string().refine(val => { //due_date için
    try { //try için
      const date = new Date(val); //date için
      return date > new Date(); //date > new Date() için
    } catch { //catch için
      return false; //false için
    }
  }, { message: 'Son teslim tarihi gelecekte bir tarih olmalıdır' }), 
  max_points: z.number().min(1, 'Maksimum puan 1 veya daha büyük olmalıdır') //max_points için
}); //z.object için

// Form değerleri için tip
type AssignmentFormValues = z.infer<typeof assignmentSchema>;

export default function CreateAssignmentPage() { //CreateAssignmentPage için
  const { courseId, lessonId } = useParams(); //courseId, lessonId için
  const router = useRouter(); //router için
  const [loading, setLoading] = useState(false); //loading için
  const [error, setError] = useState<string | null>(null); //error için

  // Form değerleri için tip
  const { register, handleSubmit, formState: { errors } } = useForm<AssignmentFormValues>({ //register, handleSubmit, formState: { errors } için
    resolver: zodResolver(assignmentSchema), //zodResolver için
    defaultValues: { //defaultValues için
      title: '', //title için
      description: '', //description için
      due_date: '', //due_date için
      max_points: 100 //max_points için
    }
  }); //useForm için

  // Form gönderimi
  const onSubmit = async (data: AssignmentFormValues) => { //onSubmit için
    try {
      setLoading(true); //setLoading için
      
      // API'ye gönderilecek veriyi hazırla
      const assignmentData = { //assignmentData için
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
      
      toast.success('Ödev başarıyla oluşturuldu!'); //toast.success için
      router.push(`/courses/${courseId}/lessons/${lessonId}/assignments`); //router.push için
    } catch (err) { //err için
      console.error('Error creating assignment:', err); //console.error için
      setError('Ödev oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.'); //setError için
    } finally { //finally için
      setLoading(false); //setLoading için
    }
  };

  // Minimum tarih belirleme (bugün)
  const today = new Date(); //today için
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset()); //today.setMinutes için
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