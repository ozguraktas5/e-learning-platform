'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { coursesApi, Course } from '@/lib/api/courses';
import { reviewsApi, CourseReviewsResponse } from '@/lib/api/reviews';
import StarRating from '@/components/StarRating';

export default function CourseReviewsPage() {
  const { courseId } = useParams();
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

  // Format time ago function
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
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h2 className="text-xl font-semibold text-red-700 mb-2">Hata</h2>
        <p className="text-red-600">{error || 'Kurs bulunamadı'}</p>
        <Link href="/instructor/courses" className="mt-4 inline-block text-blue-600 hover:underline">
          Kurslara Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Kurs Değerlendirmeleri</h1>
        <Link
          href={`/instructor/courses/${courseId}`}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Kursa Dön
        </Link>
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

      {!reviewsData?.reviews.length ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-600">Henüz değerlendirme yapılmamış.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviewsData.reviews.map((review) => (
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
              
              {/* Eğitmen yanıt verme butonu */}
              {!review.instructor_reply && (
                <div className="mt-4 flex justify-end">
                  <Link
                    href={`/instructor/courses/${courseId}/reviews/${review.id}/reply`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Yanıtla
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 