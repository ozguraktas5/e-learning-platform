'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { coursesApi, Course } from '@/lib/api/courses';
import { reviewsApi, CourseReviewsResponse } from '@/lib/api/reviews';
import { useAuth } from '@/hooks/useAuth';
import StarRating from '@/components/StarRating';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function CourseReviewsPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [reviewsData, setReviewsData] = useState<CourseReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Veri yükleme
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Kurs bilgilerini yükle
        const courseData = await coursesApi.getCourse(Number(courseId));
        setCourse(courseData);
        
        // Değerlendirme verilerini yükle
        const reviewsResponse = await reviewsApi.getCourseReviews(Number(courseId));
        setReviewsData(reviewsResponse);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Veriler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  const handleDeleteReview = async (reviewId: number) => {
    if (!user) {
      toast.error('Bu işlemi gerçekleştirmek için giriş yapmalısınız');
      return;
    }

    if (!confirm('Bu değerlendirmeyi silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await reviewsApi.deleteReview(Number(courseId), reviewId);
      toast.success('Değerlendirme başarıyla silindi');
      
      // Değerlendirme listesini güncelle
      const updatedReviews = reviewsData?.reviews.filter(
        (review) => review.id !== reviewId
      ) || [];
      
      setReviewsData(
        reviewsData
          ? {
              ...reviewsData,
              reviews: updatedReviews,
              total_reviews: reviewsData.total_reviews - 1,
            }
          : null
      );
    } catch (err) {
      console.error('Error deleting review:', err);
      toast.error('Değerlendirme silinirken bir hata oluştu');
    }
  };

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

  if (loading) {
    return <LoadingSpinner size="medium" />;
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
        <h1 className="text-2xl font-bold">Kurs Değerlendirmeleri</h1>
        <div className="flex space-x-4">
          {user && course && Number(user.id) !== course.instructor_id && (
            <Link
              href={`/student/courses/${courseId}/review`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Değerlendir
            </Link>
          )}
          <Link
            href={`/student/courses/${courseId}`}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Kursa Dön
          </Link>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
        <p className="text-gray-600 mb-4">Eğitmen: {course.instructor_name}</p>
        
        <div className="flex items-center mb-2">
          <div className="flex mr-2">
            <StarRating rating={reviewsData?.average_rating || 0} readOnly size={5} />
          </div>
          <span className="text-xl font-semibold">{reviewsData?.average_rating.toFixed(1) || '0.0'}</span>
          <span className="text-gray-500 ml-2">({reviewsData?.total_reviews || 0} değerlendirme)</span>
        </div>
      </div>

      {reviewsData?.reviews.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-600">Henüz değerlendirme yapılmamış.</p>
          {user && course && Number(user.id) !== course.instructor_id && (
            <Link
              href={`/student/courses/${courseId}/review`}
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              İlk Değerlendirmeyi Yap
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {reviewsData?.reviews.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm">
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
              
              {review.instructor_reply && (
                <div className="mt-4 pl-4 border-l-4 border-blue-200 bg-blue-50 p-3 rounded">
                  <p className="text-sm font-medium text-blue-700">Eğitmen Yanıtı:</p>
                  <p className="text-gray-700 mt-1">{review.instructor_reply}</p>
                  {review.instructor_reply_date && (
                    <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(review.instructor_reply_date)}</p>
                  )}
                </div>
              )}
              
              {/* Değerlendirme sahibi veya eğitmen için işlemler */}
              {user && (Number(user.id) === review.user_id || (course.instructor_id === Number(user.id))) && (
                <div className="mt-4 flex space-x-3 justify-end">
                  {Number(user.id) === review.user_id && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/student/courses/${courseId}/reviews/${review.id}/edit`)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Sil
                      </button>
                    </div>
                  )}
                  
                  {course.instructor_id === Number(user.id) && !review.instructor_reply && (
                    <button
                      onClick={() => router.push(`/student/courses/${courseId}/reviews/${review.id}/reply`)}
                      className="text-green-600 hover:text-green-800"
                    >
                      Yanıtla
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 