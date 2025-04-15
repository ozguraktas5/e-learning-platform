import { useState, useEffect } from 'react';
import { courseApi } from '@/lib/api/courses';

export function useEnrollment(courseId: number) {
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkEnrollment();
  }, [courseId]);

  const checkEnrollment = async () => {
    try {
      const response = await courseApi.checkEnrollment(courseId);
      setIsEnrolled(response.is_enrolled);
    } catch (err) {
      setError('Kayıt durumu kontrol edilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const enroll = async () => {
    try {
      await courseApi.enrollCourse(courseId);
      setIsEnrolled(true);
    } catch (err) {
      setError('Kursa kayıt olurken bir hata oluştu');
      throw err;
    }
  };

  return { isEnrolled, loading, error, enroll };
}