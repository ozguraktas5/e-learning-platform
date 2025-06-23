'use client';

import { useState, useEffect } from 'react';  // React'ten useState ve useEffect'i içe aktarır.
import { useRouter } from 'next/navigation';  // Next.js'ten useRouter'u içe aktarır.
import { assignmentsApi, CreateAssignmentData, CourseWithLessons } from '@/lib/api/assignments';  // assignmentsApi, CreateAssignmentData ve CourseWithLessons'u içe aktarır.
import { toast } from 'react-hot-toast';  // react-hot-toast'tan toast'u içe aktarır.
import Link from 'next/link';  // Next.js'ten Link'i içe aktarır.
import { format } from 'date-fns';  // date-fns'ten format'u içe aktarır.

export default function CreateAssignmentPage() {  // CreateAssignmentPage bileşenini dışa aktarır.
  const router = useRouter();  // router değişkenini oluşturur ve useRouter'ı kullanarak Next.js router'ını alır.
  const [loading, setLoading] = useState(false);  // loading değişkenini oluşturur ve false ile başlatır.
  const [courses, setCourses] = useState<CourseWithLessons[]>([]);  // courses değişkenini oluşturur ve CourseWithLessons tipinde bir dizi ile başlatır.
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');  // selectedCourseId değişkenini oluşturur ve number veya '' tipinde başlatır.
  const [lessonOptions, setLessonOptions] = useState<{ id: number; title: string }[]>([]);  // lessonOptions değişkenini oluşturur ve { id: number; title: string } tipinde bir dizi ile başlatır.
  const [formData, setFormData] = useState<CreateAssignmentData>({  // formData değişkenini oluşturur ve CreateAssignmentData tipinde bir nesne ile başlatır.
    title: '',  // title değişkenini '' ile başlatır.
    description: '',  // description değişkenini '' ile başlatır.
    lesson_id: 0,  // lesson_id değişkenini 0 ile başlatır.
    due_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),  // due_date değişkenini format fonksiyonu ile tarihleştirir.
    max_points: 100,  // max_points değişkenini 100 ile başlatır.
    is_published: true  // is_published değişkenini true ile başlatır.
  });  // formData değişkeni döner.
  const [errors, setErrors] = useState<Record<string, string>>({});  // errors değişkenini oluşturur ve Record<string, string> tipinde bir nesne ile başlatır.

  useEffect(() => {  // useEffect fonksiyonunu oluşturur.
    async function fetchData() {  // fetchData fonksiyonunu oluşturur.
      try {  // try bloğunu oluşturur.
        setLoading(true);  // setLoading fonksiyonunu çağırır ve true ile başlatır.
        const data = await assignmentsApi.getCreateAssignmentData();  // assignmentsApi'den getCreateAssignmentData fonksiyonunu çağırır.
        setCourses(data.courses);  // setCourses fonksiyonunu çağırır ve data.courses'ı parametre olarak alır.
      } catch (error) {  // catch bloğunu oluşturur.
        console.error('Error fetching course data:', error);  // console.error fonksiyonunu çağırır ve 'Error fetching course data:' ile birlikte error'i yazdırır.
        toast.error('Kurs bilgileri yüklenirken bir hata oluştu');  // toast.error fonksiyonunu çağırır ve 'Kurs bilgileri yüklenirken bir hata oluştu' ile başlatır.
      } finally {  // finally bloğunu oluşturur.
        setLoading(false);  // setLoading fonksiyonunu çağırır ve false ile başlatır.
      }
    }

    fetchData();  // fetchData fonksiyonunu çağırır.
  }, []);  // useEffect fonksiyonunu çağırır.

  // Kurs seçildiğinde ders listesini güncelle
  useEffect(() => {  // useEffect fonksiyonunu oluşturur.
    if (selectedCourseId !== '') {  // selectedCourseId değişkeni '' değilse
      const selectedCourse = courses.find(course => course.id === selectedCourseId);  // courses değişkeninden course.id değişkeni selectedCourseId değişkenine eşitse selectedCourse değişkenine atar.
      if (selectedCourse) {  // selectedCourse değişkeni varsa
        setLessonOptions(selectedCourse.lessons);  // setLessonOptions fonksiyonunu çağırır ve selectedCourse.lessons'ı parametre olarak alır.
        // Eğer daha önce seçilen bir ders varsa, o kursa ait değilse sıfırla
        if (formData.lesson_id !== 0) {  // formData.lesson_id değişkeni 0 değilse
          const lessonExists = selectedCourse.lessons.some(lesson => lesson.id === formData.lesson_id);  // selectedCourse.lessons değişkeninden lesson.id değişkeni formData.lesson_id değişkenine eşitse lessonExists değişkenine atar.
          if (!lessonExists) {  // lessonExists değişkeni false ise
            setFormData(prev => ({ ...prev, lesson_id: 0 }));  // setFormData fonksiyonunu çağırır ve prev değişkenini parametre olarak alır.
          }
        }
      } else {  // selectedCourse değişkeni yoksa
        setLessonOptions([]);  // setLessonOptions fonksiyonunu çağırır ve [] ile başlatır.
      }
    } else {  // selectedCourseId değişkeni '' ise
      setLessonOptions([]);  // setLessonOptions fonksiyonunu çağırır ve [] ile başlatır.
    }
  }, [selectedCourseId, courses, formData.lesson_id]);  // useEffect fonksiyonunu çağırır.

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {  // handleInputChange fonksiyonunu oluşturur ve e değişkenini alır.
    const { name, value } = e.target;  // name ve value değişkenlerini oluşturur ve e.target'den alır.
    
    // Ders seçimi yapıldığında ders ID'sini integer'a çevir
    if (name === 'lesson_id') {  // name değişkeni 'lesson_id' ise
      setFormData({  // setFormData fonksiyonunu çağırır.
        ...formData,  // formData değişkenini parametre olarak alır.
        [name]: parseInt(value) || 0  // name değişkeni parseInt fonksiyonu ile integer'a çevrilir.
      });
    } else if (name === 'course_id') {  // name değişkeni 'course_id' ise
      setSelectedCourseId(value === '' ? '' : parseInt(value));  // setSelectedCourseId fonksiyonunu çağırır ve value değişkeni parseInt fonksiyonu ile integer'a çevrilir.
    } else {  // name değişkeni 'lesson_id' ve 'course_id' değilse
      setFormData({  // setFormData fonksiyonunu çağırır.
        ...formData,  // formData değişkenini parametre olarak alır.
        [name]: value  // name değişkeni value'ya eşitlenir.
      });
    }
    
    // Input değiştiğinde ilgili hata mesajını temizle
    if (errors[name]) {  // errors değişkeninden name değişkeni varsa
      setErrors({  // setErrors fonksiyonunu çağırır.
        ...errors,  // errors değişkenini parametre olarak alır.
        [name]: ''  // name değişkeni '' ile başlatır.
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {  // handleCheckboxChange fonksiyonunu oluşturur ve e değişkenini alır.
    const { name, checked } = e.target;  // name ve checked değişkenlerini oluşturur ve e.target'den alır.
    setFormData({  // setFormData fonksiyonunu çağırır.
      ...formData,  // formData değişkenini parametre olarak alır.
      [name]: checked  // name değişkeni checked'a eşitlenir.
    });
  };

  const validateForm = (): boolean => {  // validateForm fonksiyonunu oluşturur ve boolean döner.
    const newErrors: Record<string, string> = {};  // newErrors değişkenini oluşturur ve Record<string, string> tipinde bir nesne ile başlatır.
    
    if (!formData.title.trim()) {  // formData.title değişkeni trim fonksiyonu ile boşlukları kaldırılır.
      newErrors.title = 'Ödev başlığı gereklidir';  // newErrors.title değişkeni 'Ödev başlığı gereklidir' ile başlatır.
    }
    
    if (!formData.description.trim()) {  // formData.description değişkeni trim fonksiyonu ile boşlukları kaldırılır.
      newErrors.description = 'Açıklama gereklidir';
    }
    
    if (!formData.lesson_id) {  // formData.lesson_id değişkeni yoksa
      newErrors.lesson_id = 'Lütfen bir ders seçin';  // newErrors.lesson_id değişkeni 'Lütfen bir ders seçin' ile başlatır.
    }
    
    if (!formData.due_date) {  // formData.due_date değişkeni yoksa
      newErrors.due_date = 'Son teslim tarihi gereklidir';  // newErrors.due_date değişkeni 'Son teslim tarihi gereklidir' ile başlatır.
    }
    
    if (!formData.max_points || formData.max_points <= 0) {  // formData.max_points değişkeni 0'dan küçükse
      newErrors.max_points = 'Geçerli bir maksimum puan girin';  // newErrors.max_points değişkeni 'Geçerli bir maksimum puan girin' ile başlatır.
    }
    
    setErrors(newErrors);  // setErrors fonksiyonunu çağırır ve newErrors değişkenini parametre olarak alır.
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {  // handleSubmit fonksiyonunu oluşturur ve e değişkenini alır.
    e.preventDefault();  // e.preventDefault() fonksiyonunu çağırır.
    
    if (!validateForm()) {  // validateForm fonksiyonu false dönerse
      toast.error('Lütfen gerekli alanları kontrol edin');  // toast.error fonksiyonunu çağırır ve 'Lütfen gerekli alanları kontrol edin' ile başlatır.
      return;
    }
    
    try {  // try bloğunu oluşturur.
      setLoading(true);  // setLoading fonksiyonunu çağırır ve true ile başlatır.
      await assignmentsApi.createAssignment(formData);  // assignmentsApi'den createAssignment fonksiyonunu çağırır ve formData değişkenini parametre olarak alır.
      toast.success('Ödev başarıyla oluşturuldu!');  // toast.success fonksiyonunu çağırır ve 'Ödev başarıyla oluşturuldu!' ile başlatır.
      router.push('/instructor/assignments');  // router.push fonksiyonunu çağırır ve '/instructor/assignments' ile yönlendirir.
    } catch (error) {  // catch bloğunu oluşturur.
      console.error('Error creating assignment:', error);  // console.error fonksiyonunu çağırır ve 'Error creating assignment:' ile birlikte error'i yazdırır.
      toast.error('Ödev oluşturulurken bir hata oluştu');  // toast.error fonksiyonunu çağırır ve 'Ödev oluşturulurken bir hata oluştu' ile başlatır.
    } finally {  // finally bloğunu oluşturur.
      setLoading(false);  // setLoading fonksiyonunu çağırır ve false ile başlatır.
    }
  };

  return (
    <div className="container mx-auto max-w-7xl p-6">
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