'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { assignmentsApi, Assignment } from '@/lib/api/assignments';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ArrowLeft, ClipboardList, Clock, Award, Send, AlertTriangle } from 'lucide-react';

interface FormValues {
  text: string;
}

export default function SubmitAssignmentPage() {
  const { courseId, lessonId, assignmentId } = useParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      text: ''
    }
  });

  useEffect(() => {
    async function fetchAssignment() {
      try {
        setLoading(true);
        const data = await assignmentsApi.getAssignment(
          Number(courseId),
          Number(lessonId),
          Number(assignmentId)
        );
        setAssignment(data);
        
        // Son teslim tarihini kontrol et
        if (new Date(data.due_date) < new Date()) {
          setError('Bu ödevin son teslim tarihi geçmiştir.');
        }
      } catch (err) {
        console.error('Error fetching assignment:', err);
        setError('Ödev bilgileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }

    fetchAssignment();
  }, [courseId, lessonId, assignmentId]);

  const onSubmit = async (data: FormValues) => {
    try {
      // Son teslim tarihini kontrol et
      if (assignment && new Date(assignment.due_date) < new Date()) {
        toast.error('Bu ödevin son teslim tarihi geçmiştir.');
        return;
      }

      setSubmitting(true);
      await assignmentsApi.submitAssignment(
        Number(courseId),
        Number(lessonId),
        Number(assignmentId),
        { text: data.text }
      );
      
      toast.success('Ödev başarıyla teslim edildi!');
      router.push(`/student/courses/${courseId}/lessons/${lessonId}/assignments`);
    } catch (err) {
      console.error('Error submitting assignment:', err);
      toast.error('Ödev gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  // Tarih formatını düzenleyen yardımcı fonksiyon
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return <LoadingSpinner size="large" fullScreen />;
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="font-semibold text-lg">Hata Oluştu</h3>
            </div>
            <p className="mb-4">{error || 'Ödev bulunamadı'}</p>
            <Link 
              href={`/student/courses/${courseId}/lessons/${lessonId}/assignments`} 
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Ödevlere Geri Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Son teslim tarihinin geçip geçmediğini kontrol et
  const isPastDue = new Date(assignment.due_date) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-indigo-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href={`/student/courses/${courseId}/lessons/${lessonId}/assignments`}
                  className="p-2 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-indigo-600" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {assignment.title}
                  </h1>
                  <p className="text-gray-600 mt-1">Ödev Teslimi</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-full text-sm font-medium border ${
                  isPastDue 
                    ? 'bg-red-100 text-red-700 border-red-200' 
                    : 'bg-green-100 text-green-700 border-green-200'
                }`}>
                  {isPastDue ? 'Süresi Dolmuş' : 'Aktif'}
                </div>
                <ClipboardList className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Details */}
        <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-indigo-100 p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-indigo-600" />
              Ödev Açıklaması
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{assignment.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Teslim Tarihi</p>
                <p className="text-blue-800 font-semibold">{formatDate(assignment.due_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Award className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600 font-medium">Maksimum Puan</p>
                <p className="text-purple-800 font-semibold">{assignment.max_points}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Form or Past Due Message */}
        {isPastDue ? (
          <div className="backdrop-blur-sm bg-red-50/90 border border-red-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-800">Teslim Süresi Dolmuş</h3>
            </div>
            <p className="text-red-700 mb-4">
              Bu ödevin son teslim tarihi geçmiştir. Artık teslim edilemez.
            </p>
            <Link 
              href={`/student/courses/${courseId}/lessons/${lessonId}/assignments`}
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Ödevlere Geri Dön
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-indigo-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Send className="h-5 w-5 text-indigo-600" />
              Ödev Teslimi
            </h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cevabınız *
              </label>
              <textarea
                {...register('text', { 
                  required: 'Ödev içeriği gereklidir',
                  minLength: { value: 10, message: 'Ödev içeriği en az 10 karakter olmalıdır' }
                })}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Ödev cevabınızı buraya yazın..."
              ></textarea>
              {errors.text && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {errors.text.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Link 
                href={`/student/courses/${courseId}/lessons/${lessonId}/assignments`}
                className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                İptal
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Ödevi Gönder
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 