'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { assignmentsApi, CreateAssignmentData, CourseWithLessons } from '@/lib/api/assignments';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { format } from 'date-fns';

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<CourseWithLessons[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
  const [lessonOptions, setLessonOptions] = useState<{ id: number; title: string }[]>([]);
  const [formData, setFormData] = useState<CreateAssignmentData>({
    title: '',
    description: '',
    lesson_id: 0,
    due_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
    max_points: 100,
    is_published: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await assignmentsApi.getCreateAssignmentData();
        setCourses(data.courses);
      } catch (error) {
        console.error('Error fetching course data:', error);
        toast.error('Kurs bilgileri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Kurs seçildiğinde ders listesini güncelle
  useEffect(() => {
    if (selectedCourseId !== '') {
      const selectedCourse = courses.find(course => course.id === selectedCourseId);
      if (selectedCourse) {
        setLessonOptions(selectedCourse.lessons);
        // Eğer daha önce seçilen bir ders varsa, o kursa ait değilse sıfırla
        if (formData.lesson_id !== 0) {
          const lessonExists = selectedCourse.lessons.some(lesson => lesson.id === formData.lesson_id);
          if (!lessonExists) {
            setFormData(prev => ({ ...prev, lesson_id: 0 }));
          }
        }
      } else {
        setLessonOptions([]);
      }
    } else {
      setLessonOptions([]);
    }
  }, [selectedCourseId, courses, formData.lesson_id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Ders seçimi yapıldığında ders ID'sini integer'a çevir
    if (name === 'lesson_id') {
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0
      });
    } else if (name === 'course_id') {
      setSelectedCourseId(value === '' ? '' : parseInt(value));
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Input değiştiğinde ilgili hata mesajını temizle
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Ödev başlığı gereklidir';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Açıklama gereklidir';
    }
    
    if (!formData.lesson_id) {
      newErrors.lesson_id = 'Lütfen bir ders seçin';
    }
    
    if (!formData.due_date) {
      newErrors.due_date = 'Son teslim tarihi gereklidir';
    }
    
    if (!formData.max_points || formData.max_points <= 0) {
      newErrors.max_points = 'Geçerli bir maksimum puan girin';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Lütfen gerekli alanları kontrol edin');
      return;
    }
    
    try {
      setLoading(true);
      await assignmentsApi.createAssignment(formData);
      toast.success('Ödev başarıyla oluşturuldu!');
      router.push('/instructor/assignments');
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Ödev oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Yeni Ödev Oluştur</h1>
        <Link
          href="/instructor/assignments"
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
        >
          Geri Dön
        </Link>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kurs Seçimi */}
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="course_id" className="block text-sm font-medium text-gray-700 mb-1">
                Kurs
              </label>
              <select
                id="course_id"
                name="course_id"
                value={selectedCourseId}
                onChange={handleInputChange}
                className={`w-full border ${errors.course_id ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                disabled={loading}
                required
              >
                <option value="">Kurs Seçin</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              {errors.course_id && <p className="mt-1 text-sm text-red-500">{errors.course_id}</p>}
            </div>
            
            {/* Ders Seçimi */}
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="lesson_id" className="block text-sm font-medium text-gray-700 mb-1">
                Ders
              </label>
              <select
                id="lesson_id"
                name="lesson_id"
                value={formData.lesson_id || ''}
                onChange={handleInputChange}
                className={`w-full border ${errors.lesson_id ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                disabled={loading || selectedCourseId === '' || lessonOptions.length === 0}
                required
              >
                <option value="">Ders Seçin</option>
                {lessonOptions.map(lesson => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
              {errors.lesson_id && <p className="mt-1 text-sm text-red-500">{errors.lesson_id}</p>}
              {selectedCourseId !== '' && lessonOptions.length === 0 && (
                <p className="mt-1 text-sm text-amber-500">Bu kursta henüz ders bulunmuyor.</p>
              )}
            </div>
            
            {/* Başlık */}
            <div className="col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Ödev Başlığı
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Ödev başlığını girin"
                disabled={loading}
                required
              />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
            </div>
            
            {/* Açıklama */}
            <div className="col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                className={`w-full border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Ödev açıklamasını girin"
                disabled={loading}
                required
              />
              {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
            </div>
            
            {/* Son Teslim Tarihi */}
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
                Son Teslim Tarihi
              </label>
              <input
                type="datetime-local"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                className={`w-full border ${errors.due_date ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                disabled={loading}
                required
              />
              {errors.due_date && <p className="mt-1 text-sm text-red-500">{errors.due_date}</p>}
            </div>
            
            {/* Maksimum Puan */}
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="max_points" className="block text-sm font-medium text-gray-700 mb-1">
                Maksimum Puan
              </label>
              <input
                type="number"
                id="max_points"
                name="max_points"
                value={formData.max_points}
                onChange={handleInputChange}
                min="1"
                max="1000"
                className={`w-full border ${errors.max_points ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                disabled={loading}
                required
              />
              {errors.max_points && <p className="mt-1 text-sm text-red-500">{errors.max_points}</p>}
            </div>
            
            {/* Yayınlama Seçeneği */}
            <div className="col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_published"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <label htmlFor="is_published" className="ml-2 block text-sm text-gray-700">
                  Hemen yayınla
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formData.is_published
                  ? "Ödev oluşturulduktan sonra öğrenciler tarafından görülebilir olacak."
                  : "Ödev taslak olarak kaydedilecek ve daha sonra manuel olarak yayınlamanız gerekecek."}
              </p>
            </div>
          </div>
          
          {/* Gönder Butonu */}
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => router.push('/instructor/assignments')}
              className="mr-4 px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                  Kaydediliyor...
                </>
              ) : (
                'Ödevi Oluştur'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 