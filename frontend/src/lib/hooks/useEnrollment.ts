import { useState, useEffect } from 'react'; // useState ve useEffect'i import ettik
import { coursesApi } from '@/lib/api/courses'; // coursesApi'ı import ettik

export function useEnrollment(courseId: number) { // useEnrollment fonksiyonu oluşturduk
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkEnrollment();
  }, [courseId]);

  const checkEnrollment = async () => { // checkEnrollment fonksiyonu oluşturduk
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

  const enroll = async () => { // enroll fonksiyonu oluşturduk
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

  return { isEnrolled, loading, error, enroll }; // isEnrolled, loading, error ve enroll fonksiyonunu döndük
}