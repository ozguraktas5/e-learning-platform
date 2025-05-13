import { useState, useEffect } from 'react';
import { coursesApi } from '@/lib/api/courses';

export function useEnrollment(courseId: number) {
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkEnrollment();
  }, [courseId]);

  const checkEnrollment = async () => {
    try {
      console.log(`Checking enrollment for course ID: ${courseId}`);
      const response = await coursesApi.checkEnrollment(courseId);
      console.log(`Enrollment response:`, response);
      setIsEnrolled(response.is_enrolled);
    } catch (error: any) {
      console.error('Error checking enrollment:', error);
      setError('Kayıt durumu kontrol edilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const enroll = async () => {
    try {
      console.log(`Enrolling in course ID: ${courseId}`);
      const response = await coursesApi.enrollInCourse(courseId);
      console.log(`Enrollment successful:`, response);
      setIsEnrolled(true);
    } catch (error: any) {
      console.error('Error enrolling in course:', error);
      setError('Kursa kayıt olurken bir hata oluştu');
      throw error;
    }
  };

  return { isEnrolled, loading, error, enroll };
}