'use client';

import { useState, useEffect } from 'react';  // Client-side rendering için directive
import { useParams, useRouter } from 'next/navigation';  // Route parametrelerini almak için
import { useForm } from 'react-hook-form';  // Form işleme için
import { assignmentsApi, Assignment } from '@/lib/api/assignments';  // Assignment API'sini içe aktar
import { toast } from 'react-hot-toast';  // Toast mesajları için
import Link from 'next/link';  // Link componenti için

interface FormValues {
  text: string;
}

export default function SubmitAssignmentPage() {  // SubmitAssignmentPage componenti
  const { courseId, lessonId, assignmentId } = useParams();  // Route parametrelerini al
  const router = useRouter();  // Router instance'ını al
  const [assignment, setAssignment] = useState<Assignment | null>(null);  // Assignment state'ini tut
  const [loading, setLoading] = useState(true);  // Loading durumunu kontrol et
  const [submitting, setSubmitting] = useState(false);  // Submit durumunu kontrol et
  const [error, setError] = useState<string | null>(null);  // Hata durumunu kontrol et

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({  // Form işleme için
    defaultValues: {  // Varsayılan değerler
      text: ''  // Text alanının varsayılan değeri
    }
  });

  useEffect(() => {  // useEffect hook'u ile component mount edildiğinde veya dependency değiştiğinde çalışır
    async function fetchAssignment() {  // fetchAssignment fonksiyonu
      try {  // Try block
        setLoading(true);  // Loading durumunu true yap
        const data = await assignmentsApi.getAssignment(  // Assignment API'sini çağır
          Number(courseId),  // Course ID'yi al
          Number(lessonId),  // Lesson ID'yi al
          Number(assignmentId)  // Assignment ID'yi al
        );
        setAssignment(data);  // Assignment state'ini güncelle
        
        // Son teslim tarihini kontrol et
        if (new Date(data.due_date) < new Date()) {
          setError('Bu ödevin son teslim tarihi geçmiştir.');  // Hata mesajını göster
        }
      } catch (err) {  // Hata durumunda
        console.error('Error fetching assignment:', err);  // Hata mesajını konsola yazdır
        setError('Ödev bilgileri yüklenirken bir hata oluştu.');  // Hata mesajını göster
      } finally {
        setLoading(false);  // Loading durumunu false yap
      }
    }

    fetchAssignment();  // fetchAssignment fonksiyonunu çağır
  }, [courseId, lessonId, assignmentId]);  // Dependency array

  const onSubmit = async (data: FormValues) => {  // onSubmit fonksiyonu
    try {
      // Son teslim tarihini kontrol et
      if (assignment && new Date(assignment.due_date) < new Date()) {
        toast.error('Bu ödevin son teslim tarihi geçmiştir.');
        return;
      }

      setSubmitting(true);  // Submit durumunu true yap
      await assignmentsApi.submitAssignment(  // Assignment API'sini çağır
        Number(courseId),  // Course ID'yi al
        Number(lessonId),  // Lesson ID'yi al
        Number(assignmentId),  // Assignment ID'yi al
        { text: data.text }  // Text alanının değeri
      );
      
      toast.success('Ödev başarıyla teslim edildi!');  // Toast mesajı göster
      router.push(`/courses/${courseId}/lessons/${lessonId}/assignments`);  // Router'ı güncelle
    } catch (err) {  // Hata durumunda
      console.error('Error submitting assignment:', err);  // Hata mesajını konsola yazdır
      toast.error('Ödev gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');  // Toast mesajı göster
    } finally {
      setSubmitting(false);  // Submit durumunu false yap
    }
  };

  // Tarih formatını düzenleyen yardımcı fonksiyon
  const formatDate = (dateString: string) => {  // formatDate fonksiyonu
    const date = new Date(dateString);  // Tarihi al
    return new Intl.DateTimeFormat('tr-TR', {  // Tarihi formatla
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {  // Loading durumunda
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !assignment) {  // Hata durumunda
    return (
      <div className="p-6">
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          <h3 className="font-medium">Hata</h3>
          <p className="mt-2">{error || 'Ödev bulunamadı'}</p>
          <Link href={`/courses/${courseId}/lessons/${lessonId}/assignments`} className="mt-4 block text-blue-600 hover:underline">
            Ödevlere geri dön
          </Link>
        </div>
      </div>
    );
  }

  // Son teslim tarihinin geçip geçmediğini kontrol et
  const isPastDue = new Date(assignment.due_date) < new Date();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{assignment.title}</h1>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isPastDue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {isPastDue ? 'Süresi Dolmuş' : 'Aktif'}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="mb-4">
          <h2 className="text-lg font-medium mb-2">Ödev Açıklaması</h2>
          <div className="text-gray-700 whitespace-pre-line">{assignment.description}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Teslim Tarihi:</span> {formatDate(assignment.due_date)}
          </div>
          <div>
            <span className="font-medium">Maksimum Puan:</span> {assignment.max_points}
          </div>
        </div>
      </div>

      {isPastDue ? (
        <div className="bg-red-50 p-4 rounded-lg mb-6">
          <p className="text-red-800">
            Bu ödevin son teslim tarihi geçmiştir. Artık teslim edilemez.
          </p>
          <Link 
            href={`/courses/${courseId}/lessons/${lessonId}/assignments`}
            className="mt-2 inline-block text-blue-600 hover:underline"
          >
            Ödevlere geri dön
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-4">Ödev Teslimi</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cevabınız
            </label>
            <textarea
              {...register('text', { 
                required: 'Ödev içeriği gereklidir',
                minLength: { value: 10, message: 'Ödev içeriği en az 10 karakter olmalıdır' }
              })}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ödev cevabınızı buraya yazın..."
            ></textarea>
            {errors.text && (
              <p className="mt-1 text-sm text-red-600">{errors.text.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Link 
              href={`/courses/${courseId}/lessons/${lessonId}/assignments`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              İptal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {submitting ? 'Gönderiliyor...' : 'Ödevi Gönder'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 