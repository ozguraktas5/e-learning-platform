'use client'; 

import { useState, useEffect } from 'react';  // Client-side rendering için directive    
import { useParams, useRouter } from 'next/navigation';     // Route parametrelerini almak için
import { assignmentsApi } from '@/lib/api/assignments';   // API fonksiyonlarını içe aktar
import { toast } from 'react-hot-toast';  // Toast mesajları için
import Link from 'next/link';  // Link componenti için
import { format } from 'date-fns';  // Tarih formatlama için
import LoadingSpinner from '@/components/ui/LoadingSpinner';  // Loading spinner için

export default function EditAssignmentPage() {  // EditAssignmentPage componenti
  const router = useRouter();  // Router instance'ını al
  const params = useParams();  // Route parametrelerini al
  const courseId = Number(params.courseId);  // Course ID'yi al
  const lessonId = Number(params.lessonId);  // Lesson ID'yi al
  const assignmentId = Number(params.assignmentId);  // Assignment ID'yi al

  const [loading, setLoading] = useState(true);  // Loading durumunu kontrol et
  const [saving, setSaving] = useState(false);  // Kaydedilme durumunu kontrol et
  const [formData, setFormData] = useState({  // Form verilerini tut
    title: '',  // Başlık
    description: '',  // Açıklama
    due_date: '',  // Son teslim tarihi
    max_points: 100,  // Maksimum puan
    is_published: true  // Yayın durumu
  });

  useEffect(() => {  // useEffect hook'u ile component mount edildiğinde veya dependency değiştiğinde çalışır
    async function fetchAssignment() {  // fetchAssignment fonksiyonu
      try {
        setLoading(true);  // Loading durumunu true yap
        const assignment = await assignmentsApi.getAssignment(courseId, lessonId, assignmentId);  // Assignment API'sini çağır
        setFormData({  // Form verilerini güncelle
          title: assignment.title,  // Başlık
          description: assignment.description,  // Açıklama
          due_date: format(new Date(assignment.due_date), "yyyy-MM-dd'T'HH:mm"),  // Son teslim tarihi
          max_points: assignment.max_points,  // Maksimum puan
          is_published: assignment.status !== 'draft'  // Yayın durumu
        });
      } catch (error) {  // Hata durumunda
        console.error('Error fetching assignment:', error);  // Hata mesajını konsola yazdır
        toast.error('Ödev bilgileri yüklenirken bir hata oluştu');  // Toast mesajı göster
      } finally {
        setLoading(false);  // Loading durumunu false yap
      }
    }

    fetchAssignment();  // fetchAssignment fonksiyonunu çağır
  }, [courseId, lessonId, assignmentId]);  // Dependency array

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {  // handleInputChange fonksiyonu
    const { name, value } = e.target;  // Input değerini al
    setFormData(prev => ({  // Form verilerini güncelle
      ...prev,  // Önceki verileri koru
      [name]: value  // Yeni değeri ekle
    }));
  }; 

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {  // handleCheckboxChange fonksiyonu
    const { name, checked } = e.target;  // Checkbox değerini al
    setFormData(prev => ({  // Form verilerini güncelle
      ...prev,  // Önceki verileri koru
      [name]: checked  // Yeni değeri ekle
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {  // handleSubmit fonksiyonu
    e.preventDefault();  // Form submit etmeyi engelle
    
    try {  // Try block
      setSaving(true);  // Kaydedilme durumunu true yap
      await assignmentsApi.updateAssignment(courseId, lessonId, assignmentId, {  // Assignment API'sini çağır
        title: formData.title,  // Başlık
        description: formData.description,  // Açıklama
        due_date: formData.due_date,  // Son teslim tarihi
        max_points: formData.max_points,  // Maksimum puan
        is_published: formData.is_published  // Yayın durumu
      });
      
      toast.success('Ödev başarıyla güncellendi');  // Toast mesajı göster
      router.push(`/instructor/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}`);  // Router'ı güncelle
    } catch (error) {  // Hata durumunda
      console.error('Error updating assignment:', error);  // Hata mesajını konsola yazdır
      toast.error('Ödev güncellenirken bir hata oluştu');  // Toast mesajı göster
    } finally {
      setSaving(false);  // Kaydedilme durumunu false yap
    }
  };

  if (loading) {  // Loading durumunda
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Ödevi Düzenle</h1>
          <Link
            href={`/instructor/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}`}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            Geri Dön
          </Link>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Başlık
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>
              
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Son Teslim Tarihi
                </label>
                <input
                  type="datetime-local"
                  id="due_date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="max_points" className="block text-sm font-medium text-gray-700 mb-1">
                  Maksimum Puan
                </label>
                <input
                  type="number"
                  id="max_points"
                  name="max_points"
                  value={formData.max_points}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_published"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_published" className="ml-2 block text-sm text-gray-700">
                  Yayınla
                </label>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Link
                  href={`/instructor/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}`}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  İptal
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-md ${
                    saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                  } transition-colors`}
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 