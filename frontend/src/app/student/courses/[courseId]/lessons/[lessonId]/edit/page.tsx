'use client';

import { useState, useEffect } from 'react'; //useState, useEffect için
import { useParams, useRouter } from 'next/navigation'; //useParams, useRouter için
import { useForm } from 'react-hook-form'; //useForm için
import { zodResolver } from '@hookform/resolvers/zod'; //zodResolver için
import { z } from 'zod'; //z için
import { lessonApi } from '@/lib/api/lessons'; //lessonApi için
import { Lesson, CreateLessonData } from '@/types/lesson'; //Lesson, CreateLessonData için
import { toast } from 'react-hot-toast'; //toast için
import { BASE_URL } from '@/lib/api/index'; //BASE_URL için
import Link from 'next/link'; //Link için
import LoadingSpinner from '@/components/ui/LoadingSpinner'; //LoadingSpinner için
import { ArrowLeft, BookOpen, Edit, Upload, AlertTriangle, CheckCircle, Play } from 'lucide-react'; //ArrowLeft, BookOpen, Edit, Upload, AlertTriangle, CheckCircle, Play için

const lessonSchema = z.object({ //lessonSchema için
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır'), //title için
  content: z.string().min(10, 'İçerik en az 10 karakter olmalıdır'), //content için
  order: z.number().min(1, 'Sıra numarası 1 veya daha büyük olmalıdır') //order için
}); //z.object için

// UpdateLessonData için kullanılacak tip
type LessonFormData = CreateLessonData; //LessonFormData için

export default function EditLessonPage() { //EditLessonPage için
  const { courseId, lessonId } = useParams(); //courseId, lessonId için
  const router = useRouter(); //router için
  const [loading, setLoading] = useState(false); //loading için
  const [fetchLoading, setFetchLoading] = useState(true); //fetchLoading için
  const [error, setError] = useState<string | null>(null); //error için
  const [selectedFile, setSelectedFile] = useState<File | null>(null); //selectedFile için
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null); //currentLesson için

  const { register, handleSubmit, formState: { errors }, reset } = useForm<LessonFormData>({ //register, handleSubmit, formState: { errors }, reset için
    resolver: zodResolver(lessonSchema), //zodResolver için
    defaultValues: { //defaultValues için
      title: '', //title için
      content: '', //content için
      order: 1 //order için
    }
  }); //useForm için

  const numericCourseId = Number(courseId); //numericCourseId için
  const numericLessonId = Number(lessonId); //numericLessonId için

  // Mevcut ders bilgilerini getir
  useEffect(() => { //useEffect için
    const fetchLessonDetails = async () => { //fetchLessonDetails için
      if (isNaN(numericCourseId) || isNaN(numericLessonId)) { //isNaN(numericCourseId) || isNaN(numericLessonId) için
        setError('Geçersiz Kurs ID veya Ders ID'); //setError için
        setFetchLoading(false); //setFetchLoading için
        return; //return için
      }

      try { //try için
        const lessonData = await lessonApi.getLesson(numericCourseId, numericLessonId); //lessonApi.getLesson için
        setCurrentLesson(lessonData); //setCurrentLesson için
        
        // Form alanlarını doldur (reset için)
        reset({ 
          title: lessonData.title, //title için
          content: lessonData.content, //content için
          order: lessonData.order //order için
        });
      } catch (err) { //err için
        console.error('Error fetching lesson details:', err); //console.error için
        setError('Ders bilgileri yüklenirken bir hata oluştu'); //setError için
      } finally { //finally için
        setFetchLoading(false); //setFetchLoading için
      }
    }; //fetchLessonDetails için

    fetchLessonDetails(); //fetchLessonDetails için
  }, [numericCourseId, numericLessonId, reset]); //numericCourseId, numericLessonId, reset için

  const onSubmit = async (data: LessonFormData) => { //onSubmit için
    if (isNaN(numericCourseId) || isNaN(numericLessonId)) { //isNaN(numericCourseId) || isNaN(numericLessonId) için
      setError('Geçersiz Kurs ID veya Ders ID'); //setError için
      return; //return için
    }
  
    setLoading(true); //setLoading için
    setError(null); //setError için

    try { //try için
      // Dersi güncelle
      const updatedLesson = await lessonApi.updateLesson(numericCourseId, numericLessonId, data); //lessonApi.updateLesson için
      toast.success(`Ders '${updatedLesson.title}' güncellendi.`); //toast.success için

      // Eğer yeni bir video seçilmişse, onu da yükle
      if (selectedFile) { //selectedFile için
        const formData = new FormData(); //FormData için
        formData.append('video', selectedFile); //formData.append için
        
        await lessonApi.uploadMedia(numericCourseId, numericLessonId, formData); //lessonApi.uploadMedia için
        toast.success(`Video '${selectedFile.name}' başarıyla yüklendi.`); //toast.success için
      }

      // Dersler sayfasına geri dön
      router.push(`/student/courses/${courseId}/lessons`); //router.push için

    } catch (err: unknown) { //err için
      console.error('Error during lesson update or upload process:', err); //console.error için
      const errorMessage = err instanceof Error ? err.message : String(err); //errorMessage için
      setError(`Ders güncellenirken bir hata oluştu: ${errorMessage || 'Bilinmeyen hata'}`); //setError için
    } finally { //finally için
      setLoading(false); //setLoading için
    }
  }; //onSubmit için

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { //handleFileChange için
    const file = event.target.files?.[0]; //file için
    if (file) { //file için
      setSelectedFile(file); //setSelectedFile için
      setError(null); //setError için
      console.log('File selected:', file.name); //console.log için
    } else { //else için
      setSelectedFile(null); //setSelectedFile için
    }
  }; //handleFileChange için

  if (fetchLoading) { //fetchLoading için
    return <LoadingSpinner size="large" fullScreen />; //LoadingSpinner için
  }

  if (error && !currentLesson) { //error veya currentLesson için
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="font-semibold text-lg">Hata Oluştu</h3>
            </div>
            <p className="mb-4">{error}</p>
            <Link 
              href={`/student/courses/${courseId}/lessons`} 
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Derslere Geri Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Başlık */}
        <div className="mb-8">
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-indigo-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href={`/student/courses/${courseId}/lessons`}
                  className="p-2 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-indigo-600" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Dersi Düzenle
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {currentLesson?.title ? `"${currentLesson.title}" dersini düzenleyin` : 'Ders bilgilerini güncelleyin'}
                  </p>
                </div>
              </div>
              <BookOpen className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Hata Mesajı */}
        {error && (
          <div className="mb-6">
            <div className="backdrop-blur-sm bg-red-50/90 border border-red-200 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-indigo-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Başlık Alanı */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ders Başlığı *
              </label>
              <input
                {...register('title')}
                type="text"
                placeholder="Ders başlığını girin..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* İçerik Alanı */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ders İçeriği *
              </label>
              <textarea
                {...register('content')}
                rows={8}
                placeholder="Ders içeriğini girin... (HTML destekler)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none"
              />
              {errors.content && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {errors.content.message}
                </p>
              )}
            </div>

            {/* Sıra Numarası Alanı */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sıra Numarası *
              </label>
              <input
                {...register('order', { valueAsNumber: true })}
                type="number"
                min="1"
                placeholder="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
              {errors.order && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {errors.order.message}
                </p>
              )}
            </div>

            {/* Mevcut Video Görüntüleme */}
            {currentLesson?.video_url && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mevcut Video
                </label>
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  <video
                    src={`${BASE_URL}${currentLesson.video_url}`}
                    controls
                    className="w-full max-h-64 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <Play className="h-3 w-3" />
                    Mevcut Video
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Yeni bir video yüklerseniz, mevcut video değiştirilecektir.
                </p>
              </div>
            )}

            {/* Video Yükleme Alanı */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {currentLesson?.video_url ? 'Videoyu Değiştir (İsteğe bağlı)' : 'Video Ekle (İsteğe bağlı)'}
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="w-full flex items-center justify-center gap-3 px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                >
                  <Upload className="h-6 w-6 text-gray-400" />
                  <div className="text-center">
                    <p className="text-gray-600 font-medium">
                      {selectedFile ? 'Dosyayı değiştirmek için tıklayın' : 'Video dosyası seçin'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      MP4, AVI, MOV formatları desteklenir
                    </p>
                  </div>
                </label>
              </div>
              
              {selectedFile && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Yeni dosya seçildi:</p>
                      <p className="text-sm text-green-700">{selectedFile.name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* İşlem Butonları */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Güncelleniyor...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4" />
                    Dersi Güncelle
                  </>
                )}
              </button>
              <Link
                href={`/student/courses/${courseId}/lessons`}
                className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                İptal
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 