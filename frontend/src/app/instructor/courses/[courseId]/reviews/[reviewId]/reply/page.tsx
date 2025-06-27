'use client';

import { useState, useEffect } from 'react';  // Client-side rendering için directive
import { useParams, useRouter } from 'next/navigation';  // Route parametrelerini almak için
import { useForm } from 'react-hook-form';  // useForm hook'u içe aktar
import { toast } from 'react-hot-toast';  // Toast için
import Link from 'next/link';  // Link için
import { coursesApi, Course } from '@/lib/api/courses';  // Courses API'sini içe aktar
import { reviewsApi, Review, ReplyData } from '@/lib/api/reviews';  // Reviews API'sini içe aktar
import { useAuth } from '@/contexts/AuthContext';  // useAuth hook'u içe aktar
import StarRating from '@/components/StarRating';  // StarRating componentini içe aktar

export default function ReviewReplyPage() {  // ReviewReplyPage componenti
  const { courseId, reviewId } = useParams();  // Route parametrelerini al
  const router = useRouter();  // Router için
  const { user } = useAuth();  // useAuth hook'u içe aktar
  const [course, setCourse] = useState<Course | null>(null);  // Course state'ini kontrol et
  const [review, setReview] = useState<Review | null>(null);  // Review state'ini kontrol et
  const [loading, setLoading] = useState(true);  // Loading durumunu kontrol et
  const [submitting, setSubmitting] = useState(false);  // Submitting state'ini kontrol et
  const [error, setError] = useState<string | null>(null);  // Error state'ini kontrol et
  const [isInstructor, setIsInstructor] = useState(false);  // IsInstructor state'ini kontrol et

  const { register, handleSubmit, formState: { errors } } = useForm<{ reply: string }>();  // useForm hook'u içe aktar

  useEffect(() => {  // useEffect hook'u ile component mount edildiğinde veya dependency değiştiğinde çalışır
    // Oturum kontrolünü kaldırdık, tüm kullanıcılar bu sayfaya erişebilir

    const fetchData = async () => {  // fetchData fonksiyonu
      try {  // Try bloğu
        setLoading(true);  // Loading durumunu true yap
        
        // Kurs bilgilerini yükle
        const courseData = await coursesApi.getCourse(Number(courseId));  // Courses API'sini kullanarak course detaylarını al
        setCourse(courseData);  // Course state'ini set et
        
        // Eğitmen kontrolü - sadece sayfanın görüntülenmesi için şimdi yükleme sırasında yapıyoruz
        if (user && courseData.instructor_id === Number(user.id)) {  // Kullanıcı ve courseData.instructor_id kullanıcının id'si ise
          setIsInstructor(true);  // IsInstructor state'ini true yap
        }
        
        // Değerlendirme verilerini yükle
        const reviewsResponse = await reviewsApi.getCourseReviews(Number(courseId));  // Reviews API'sini kullanarak course'a ait değerlendirme verilerini al
        const reviewData = reviewsResponse.reviews.find(r => r.id === Number(reviewId));  // ReviewData state'ini set et
        
        if (!reviewData) {  // ReviewData yoksa
          setError('Değerlendirme bulunamadı');  // Error state'ini set et
        } else {  // ReviewData varsa
          setReview(reviewData);  // Review state'ini set et
          
          // Eğer zaten yanıtlanmışsa değerlendirmeler sayfasına yönlendir
          if (reviewData.instructor_reply) {  // ReviewData.instructor_reply varsa
            toast.error('Bu değerlendirme zaten yanıtlanmış');  // Hata mesajını göster
            router.push(`/instructor/courses/${courseId}/reviews`);  // Değerlendirmelere dön
          }
        }
      } catch (err) {  // Hata durumunda
        console.error('Error fetching data:', err);  // Hata mesajını konsola yazdır
        setError('Veriler yüklenirken bir hata oluştu');  // Error state'ini set et
      } finally {  // Finally bloğu
        setLoading(false);  // Loading durumunu false yap
      }
    };  // fetchData fonksiyonunu çağır

    fetchData();  // fetchData fonksiyonunu çağır
  }, [courseId, reviewId, router, user]);  // courseId, reviewId, router, user değiştiğinde çalışır

  const onSubmit = async (data: { reply: string }) => {  // onSubmit fonksiyonu
    // Yanıt gönderme sırasında eğitmen yetkisini kontrol et
    if (!user) {  // Kullanıcı yoksa
      toast.error('Değerlendirmeye yanıt vermek için giriş yapmalısınız');  // Hata mesajını göster
      // Mevcut sayfayı kaydet
      if (typeof window !== 'undefined') {  // window undefined değilse
        localStorage.setItem('redirectAfterLogin', window.location.pathname);  // Mevcut sayfayı kaydet
      }
      router.push('/login');  // Login sayfasına yönlendir
      return;  // Fonksiyonu sonlandır
    }

    if (!course || Number(user.id) !== course.instructor_id) {  // Course veya user.id course.instructor_id değilse
      toast.error('Bu işlemi yapmaya yetkiniz yok');  // Hata mesajını göster
      return;  // Fonksiyonu sonlandır
    }

    try {  // Try bloğu
      setSubmitting(true);  // Submitting state'ini true yap
      const replyData: ReplyData = {  // ReplyData tipini kullan
        reply: data.reply  // Reply
      };

      await reviewsApi.replyToReview(Number(courseId), Number(reviewId), replyData);  // Reviews API'sini kullanarak review'a yanıt ver
      toast.success('Yanıtınız başarıyla kaydedildi');  // Başarı mesajını göster
      router.push(`/instructor/courses/${courseId}/reviews`);  // Değerlendirmelere dön
    } catch (err) {  // Hata durumunda
      console.error('Error submitting reply:', err);  // Hata mesajını konsola yazdır
      toast.error('Yanıt gönderilirken bir hata oluştu');  // Hata mesajını göster
    } finally {  // Finally bloğu
      setSubmitting(false);  // Submitting state'ini false yap
    }
  };  // onSubmit fonksiyonunu çağır

  if (loading) {  // Loading durumunda
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !course || !review) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h2 className="text-xl font-semibold text-red-700 mb-2">Hata</h2>
        <p className="text-red-600">{error || 'Değerlendirme bilgisi bulunamadı'}</p>
        <Link href="/instructor/courses" className="mt-4 inline-block text-blue-600 hover:underline">
          Kurslara Dön
        </Link>
      </div>
    );
  }

  // Belirtilen tarihten bu yana geçen süreyi formatlar
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    const intervals = {
      yıl: 31536000,
      ay: 2592000,
      hafta: 604800,
      gün: 86400,
      saat: 3600,
      dakika: 60,
      saniye: 1
    };
    
    for (const [unit, seconds] of Object.entries(intervals)) {
      const interval = Math.floor(diffInSeconds / seconds);
      if (interval >= 1) {
        return interval === 1 ? `1 ${unit} önce` : `${interval} ${unit} önce`;
      }
    }
    
    return 'Az önce';
  };

  // Kullanıcı eğitmen değilse uyarı göster
  const showInstructorWarning = !user || !isInstructor;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Değerlendirmeye Yanıt Ver</h1>
        <Link
          href={`/instructor/courses/${courseId}/reviews`}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Değerlendirmelere Dön
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
        <p className="text-gray-600 mb-4">Eğitmen: {course.instructor_name}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            <div className="bg-gray-200 rounded-full p-2 mr-3">
              <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">{review.username || `Kullanıcı #${review.user_id}`}</h3>
              <div className="flex items-center text-sm text-gray-500">
                <span>{formatTimeAgo(review.created_at)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex">
            <StarRating rating={review.rating} readOnly size={4} />
          </div>
        </div>
        
        <p className="mt-3 text-gray-700">{review.comment}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Yanıtınızı Yazın</h2>

        {showInstructorWarning ? (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-700 mb-3">
              {!user 
                ? 'Değerlendirmeye yanıt vermek için giriş yapmalısınız.' 
                : 'Bu değerlendirmeye yanıt vermek için bu kursun eğitmeni olmalısınız.'}
            </p>
            {!user && (
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
            )}
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-6">
            <label htmlFor="reply" className="block text-gray-700 font-medium mb-2">
              Yanıtınız
            </label>
            <textarea
              id="reply"
              {...register('reply', {
                required: 'Yanıt metni zorunludur',
                minLength: {
                  value: 10,
                  message: 'Yanıt en az 10 karakter olmalıdır'
                },
                maxLength: {
                  value: 1000,
                  message: 'Yanıt en fazla 1000 karakter olabilir'
                }
              })}
              rows={6}
              placeholder="Öğrenci değerlendirmesine yanıtınızı yazın..."
              className={`w-full p-3 border ${
                errors.reply ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={showInstructorWarning}
            ></textarea>
            {errors.reply && (
              <p className="mt-1 text-red-500 text-sm">{errors.reply.message}</p>
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
              disabled={submitting || showInstructorWarning}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {submitting ? 'Gönderiliyor...' : 'Yanıtı Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 