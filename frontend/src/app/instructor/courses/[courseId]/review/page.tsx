'use client';

import { useState, useEffect } from 'react';  // Client-side rendering için directive
import { useParams, useRouter } from 'next/navigation';  // Route parametrelerini almak için
import { useForm } from 'react-hook-form';  // useForm hook'u içe aktar
import { toast } from 'react-hot-toast';  // Toast için
import Link from 'next/link';  // Link için
import { coursesApi, Course } from '@/lib/api/courses';  // Courses API'sini içe aktar
import { reviewsApi, CreateReviewData } from '@/lib/api/reviews';  // Reviews API'sini içe aktar
import { useAuth } from '@/hooks/useAuth';  // useAuth hook'u içe aktar
import StarRating from '@/components/StarRating';  // StarRating componentini içe aktar

export default function CourseReviewPage() {  // CourseReviewPage componenti
  const { courseId } = useParams();  // Route parametrelerini al
  const router = useRouter();  // Router için
  const { user } = useAuth();  // useAuth hook'u içe aktar
  const [course, setCourse] = useState<Course | null>(null);  // Course state'ini kontrol et
  const [loading, setLoading] = useState(true);  // Loading durumunu kontrol et
  const [submitting, setSubmitting] = useState(false);  // Submitting state'ini kontrol et
  const [error, setError] = useState<string | null>(null);  // Error state'ini kontrol et
  const [rating, setRating] = useState<number>(5);  // Rating state'ini kontrol et

  const { register, handleSubmit, formState: { errors } } = useForm<{ comment: string }>();  // useForm hook'u içe aktar

  useEffect(() => {  // useEffect hook'u ile component mount edildiğinde veya dependency değiştiğinde çalışır
    // Kullanıcı kontrolünü kaldırdık, hemen kurs bilgilerini yükle
    const fetchCourse = async () => {  // fetchCourse fonksiyonu
      try {  // Try bloğu
        setLoading(true);  // Loading durumunu true yap
        const courseData = await coursesApi.getCourse(Number(courseId));  // Courses API'sini kullanarak course detaylarını al
        setCourse(courseData);  // Course state'ini set et
      } catch (err) {  // Hata durumunda
        console.error('Error fetching course:', err);  // Hata mesajını konsola yazdır
        setError('Kurs bilgileri yüklenirken bir hata oluştu');  // Error mesajını göster
      } finally {  // Finally bloğu
        setLoading(false);  // Loading durumunu false yap
      }
    };  // fetchCourse fonksiyonunu çağır

    fetchCourse();  // fetchCourse fonksiyonunu çağır
  }, [courseId]);  // courseId değiştiğinde çalışır

  const onSubmit = async (data: { comment: string }) => {  // onSubmit fonksiyonu
    if (!user) {  // Kullanıcı yoksa
      toast.error('Değerlendirme yapmak için giriş yapmalısınız');  // Hata mesajını göster
      // Mevcut URL'yi localStorage'a kaydedelim, böylece giriş sonrası buraya dönebiliriz
      if (typeof window !== 'undefined') {  // window undefined değilse
        localStorage.setItem('redirectAfterLogin', window.location.pathname);  // Mevcut URL'yi localStorage'a kaydet
      }
      router.push('/login');  // Login sayfasına yönlendir
      return;  // Fonksiyonu sonlandır
    }

    if (rating < 1 || rating > 5) {  // Rating 1-5 arasında değilse
      toast.error('Lütfen 1-5 arası bir puan verin');  // Hata mesajını göster
      return;  // Fonksiyonu sonlandır
    }

    try {  // Try bloğu
      setSubmitting(true);  // Submitting state'ini true yap
      const reviewData: CreateReviewData = {  // ReviewData tipini kullan
        rating,  // Rating
        comment: data.comment  // Comment
      };

      await reviewsApi.createReview(Number(courseId), reviewData);  // Reviews API'sini kullanarak review oluştur
      toast.success('Değerlendirmeniz başarıyla kaydedildi');  // Başarı mesajını göster
      router.push(`/courses/${courseId}/reviews`);  // Reviews sayfasına yönlendir
    } catch (error) {  // Hata durumunda
      console.error('Error submitting review:', error);  // Hata mesajını konsola yazdır
      
      const errorMessage = error?.response?.data?.error;  // Error mesajını al
      
      if (errorMessage === 'Bu kurs için zaten bir değerlendirme yapmışsınız.') {  // Error mesajı "Bu kurs için zaten bir değerlendirme yapmışsınız." ise
        toast.error('Bu kurs için daha önce değerlendirme yapmışsınız');  // Hata mesajını göster
      } else if (errorMessage === 'Bu kursa değerlendirme yapabilmek için kursa kayıtlı olmalısınız.') {  // Error mesajı "Bu kursa değerlendirme yapabilmek için kursa kayıtlı olmalısınız." ise
        toast.error('Değerlendirme yapmak için kursa kayıtlı olmalısınız');  // Hata mesajını göster
      } else {  // Hata mesajı değilse
        toast.error('Değerlendirme gönderilirken bir hata oluştu');  // Hata mesajını göster
      }
    } finally {  // Finally bloğu
      setSubmitting(false);  // Submitting state'ini false yap
    }
  };

  if (loading) {  // Loading durumunda
    return (  // LoadingSpinner componentini göster
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !course) {  // Error veya course yoksa
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h2 className="text-xl font-semibold text-red-700 mb-2">Hata</h2>
        <p className="text-red-600">{error || 'Kurs bulunamadı'}</p>
        <Link href="/courses" className="mt-4 inline-block text-blue-600 hover:underline">
          Kurslara Dön
        </Link>
      </div>
    );
  }

  return (  // CourseReviewPage componenti
    <div className="container mx-auto max-w-7xl p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Kurs Değerlendirme</h1>
        <Link
          href={`/courses/${courseId}`}
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