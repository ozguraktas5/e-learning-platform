'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useAuth } from '@/hooks/useAuth';
import { enrollmentsApi, EnrollmentHistory } from '@/lib/api/enrollments';

export default function EnrollmentHistoryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [history, setHistory] = useState<EnrollmentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Eğitmen ise kendi kurslarına yönlendir
    if (user.role === 'instructor') {
      router.push('/instructor/courses');
      return;
    }
    
    fetchEnrollmentHistory();
  }, [loading, user, router]);

  const fetchEnrollmentHistory = async () => {
    try {
      setIsLoading(true);
      const data = await enrollmentsApi.getEnrollmentHistory();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching enrollment history:', error);
      toast.error('Kayıt geçmişi yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return <div className="p-8 text-center">Kayıt geçmişi yükleniyor...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-8">Kayıt Geçmişi</h1>
        <div className="text-center p-10 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Henüz hiçbir kurs kaydınız bulunmuyor</h2>
          <p className="text-gray-600 mb-6">
            Öğrenmeye başlamak için kursları keşfedin ve kaydolun
          </p>
          <Link 
            href="/courses" 
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Kursları Keşfet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Kayıt Geçmişi</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kurs Adı
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Eğitmen
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kayıt Tarihi
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tamamlama Tarihi
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((enrollment) => (
                <tr key={enrollment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {enrollment.course_title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{enrollment.instructor_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(enrollment.enrolled_at).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${enrollment.status === 'active' ? 'bg-green-100 text-green-800' : 
                        enrollment.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {enrollment.status === 'active' ? 'Aktif' : 
                        enrollment.status === 'completed' ? 'Tamamlandı' : 'İptal Edildi'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {enrollment.completed_at ? new Date(enrollment.completed_at).toLocaleDateString('tr-TR') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/courses/${enrollment.course_id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                      Kursa Git
                    </Link>
                    {enrollment.status === 'completed' && enrollment.certificate_id && (
                      <Link 
                        href={`/certificate/${enrollment.certificate_id}`} 
                        className="text-green-600 hover:text-green-900"
                      >
                        Sertifika Görüntüle
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 