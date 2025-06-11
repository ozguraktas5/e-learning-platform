'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { assignmentsApi } from '@/lib/api/assignments';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function EditAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = Number(params.courseId);
  const lessonId = Number(params.lessonId);
  const assignmentId = Number(params.assignmentId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    max_points: 100,
    is_published: true
  });

  useEffect(() => {
    async function fetchAssignment() {
      try {
        setLoading(true);
        const assignment = await assignmentsApi.getAssignment(courseId, lessonId, assignmentId);
        setFormData({
          title: assignment.title,
          description: assignment.description,
          due_date: format(new Date(assignment.due_date), "yyyy-MM-dd'T'HH:mm"),
          max_points: assignment.max_points,
          is_published: assignment.status !== 'draft'
        });
      } catch (error) {
        console.error('Error fetching assignment:', error);
        toast.error('Ödev bilgileri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }

    fetchAssignment();
  }, [courseId, lessonId, assignmentId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      await assignmentsApi.updateAssignment(courseId, lessonId, assignmentId, {
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date,
        max_points: formData.max_points,
        is_published: formData.is_published
      });
      
      toast.success('Ödev başarıyla güncellendi');
      router.push(`/instructor/courses/${courseId}/lessons/${lessonId}/assignment/${assignmentId}`);
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('Ödev güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
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
  );
} 