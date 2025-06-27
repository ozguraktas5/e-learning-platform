'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { coursesApi, Course } from '@/lib/api/courses';
import { reviewsApi, CreateReviewData } from '@/lib/api/reviews';
import { useAuth } from '@/contexts/AuthContext';
import StarRating from '@/components/StarRating';

export default function CourseReviewPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);

  const { register, handleSubmit, formState: { errors } } = useForm<{ comment: string }>();

  useEffect(() => {
    // Kullanıcı kontrolünü kaldırdık, hemen kurs bilgilerini yükle
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const courseData = await coursesApi.getCourse(Number(courseId));
        setCourse(courseData);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Kurs bilgileri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const onSubmit = async (data: { comment: string }) => {
    if (!user) {
      toast.error('Değerlendirme yapmak için giriş yapmalısınız');
      // Mevcut URL'yi localStorage'a kaydedelim, böylece giriş sonrası buraya dönebiliriz
      if (typeof window !== 'undefined') {
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
      }
      router.push('/login');
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error('Lütfen 1-5 arası bir puan verin');
      return;
    }

    try {
      setSubmitting(true);
      const reviewData: CreateReviewData = {
        rating,
        comment: data.comment
      };

      await reviewsApi.createReview(Number(courseId), reviewData);
      toast.success('Değerlendirmeniz başarıyla kaydedildi');
      router.push(`/student/courses/${courseId}/reviews`);
    } catch (error) {
      console.error('Error submitting review:', error);
      
      // API hata yanıtını kontrol et
      const errorMessage = error?.response?.data?.error;
      
      if (errorMessage === 'Bu kurs için zaten bir değerlendirme yapmışsınız.') {
        toast.error('Bu kurs için daha önce değerlendirme yapmışsınız');
      } else if (errorMessage === 'Bu kursa değerlendirme yapabilmek için kursa kayıtlı olmalısınız.') {
        toast.error('Değerlendirme yapmak için kursa kayıtlı olmalısınız');
      } else {
        toast.error('Değerlendirme gönderilirken bir hata oluştu');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h2 className="text-xl font-semibold text-red-700 mb-2">Hata</h2>
        <p className="text-red-600">{error || 'Kurs bulunamadı'}</p>
        <Link href="/student/courses" className="mt-4 inline-block text-blue-600 hover:underline">
          Kurslara Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Kurs Değerlendirme</h1>
        <Link
          href={`/student/courses/${courseId}`}
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition"
        >
          Kursa Dön
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
        <p className="text-gray-600 mb-2">Eğitmen: {course.instructor_name}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Değerlendirmenizi Yazın</h2>

        {!user ? (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-700 mb-3">
              Değerlendirme göndermek için giriş yapmalısınız.
            </p>
            <Link
              href="/login"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('redirectAfterLogin', window.location.pathname);
                }
              }}
            >
              Giriş Yap
            </Link>
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Puanınız</label>
            <div className="mb-2">
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size={8}
              />
            </div>
            <p className="text-sm text-gray-500">Kursu 1-5 yıldız arasında değerlendirin (5 = En iyi)</p>
          </div>

          <div className="mb-6">
            <label htmlFor="comment" className="block text-gray-700 font-medium mb-2">
              Yorumunuz
            </label>
            <textarea
              id="comment"
              {...register('comment', {
                required: 'Yorum alanı zorunludur',
                minLength: {
                  value: 10,
                  message: 'Yorum en az 10 karakter olmalıdır'
                },
                maxLength: {
                  value: 1000,
                  message: 'Yorum en fazla 1000 karakter olabilir'
                }
              })}
              rows={6}
              placeholder="Bu kurs hakkındaki düşüncelerinizi paylaşın..."
              className={`w-full p-3 border ${
                errors.comment ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            ></textarea>
            {errors.comment && (
              <p className="mt-1 text-red-500 text-sm">{errors.comment.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 mr-4 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting || !user}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {submitting ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 