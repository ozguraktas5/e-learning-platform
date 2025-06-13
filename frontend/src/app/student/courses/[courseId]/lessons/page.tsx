'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
// Assuming you have an API function to get lessons for a course
// Adjust the import path and function name if necessary
import { coursesApi, Lesson } from '@/lib/api/courses'; 
import { lessonApi } from '@/lib/api/lessons';
import Link from 'next/link';
import no_video from '../../../../../../../uploads/no_video.png';
import Image from 'next/image';
import { getFullUrl } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ArrowLeft, BookOpen, Play, Edit, Trash2, Plus, Eye } from 'lucide-react';

export default function CourseLessonsPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseTitle, setCourseTitle] = useState(''); // Optional: To display course title

  const numericCourseId = Number(courseId);

  useEffect(() => {
    if (isNaN(numericCourseId)) {
      toast.error('Invalid Course ID');
      router.push('/courses'); // Redirect if ID is not valid
      return;
    }

    const fetchLessonsAndCourse = async () => {
      setLoading(true);
      try {
        // Fetch course details to get the title (optional)
        const courseDetails = await coursesApi.getCourse(numericCourseId);
        setCourseTitle(courseDetails.title);
        
        // TODO: Implement or verify coursesApi.getCourseLessons(numericCourseId)
        // This function should fetch lessons for the given course ID
        // Replace with your actual API call if different
        // Example: const courseLessons = await someOtherApi.getLessonsByCourse(numericCourseId);
        const courseLessons = await coursesApi.getCourseLessons(numericCourseId); 
        setLessons(courseLessons);

      } catch (error) {
        console.error('Failed to fetch lessons or course:', error);
        toast.error('Failed to load lessons.');
        // Optionally redirect or show an error message
      } finally {
        setLoading(false);
      }
    };

    fetchLessonsAndCourse();
  }, [numericCourseId, router]);

  // Function to handle edit button click
  const handleEditLesson = (lessonId: number) => {
    router.push(`/student/courses/${courseId}/lessons/${lessonId}/edit`);
  };

  // Function to handle delete button click
  const handleDeleteLesson = async (lessonId: number, lessonTitle: string) => {
    // Show confirmation dialog
    if (!confirm(`"${lessonTitle}" dersini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      return; // User canceled
    }
    
    try {
      await lessonApi.deleteLesson(numericCourseId, lessonId);
      toast.success(`"${lessonTitle}" dersi başarıyla silindi.`);
      
      // Remove the deleted lesson from the state to update the UI
      setLessons(lessons.filter(lesson => lesson.id !== lessonId));
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      toast.error('Ders silinirken bir hata oluştu.');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen size="large" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-indigo-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href={`/student/courses/${courseId}`}
                  className="p-2 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-indigo-600" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {courseTitle}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {lessons.length} ders bulundu
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link 
                  href={`/student/courses/${courseId}/lessons/create`} 
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                  Yeni Ders Ekle
                </Link>
                <BookOpen className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Lessons Grid */}
        {lessons.length === 0 ? (
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-indigo-100 p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Henüz Ders Yok</h3>
            <p className="text-gray-600 mb-6">Bu kursa henüz ders eklenmemiş.</p>
            <Link 
              href={`/student/courses/${courseId}/lessons/create`} 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              İlk Dersi Ekle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => (
              <div 
                key={lesson.id} 
                className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-indigo-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
              >
                {/* Video/Image Section */}
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden relative">
                  {lesson.video_url ? (
                    <div className="relative w-full h-full group">
                      <video 
                        src={getFullUrl(lesson.video_url)} 
                        controls 
                        muted
                        playsInline
                        preload="metadata"
                        className="object-cover w-full h-full"
                        title={lesson.title}
                      >
                        Your browser does not support the video tag.
                      </video>
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <Play className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Image 
                        src={no_video}
                        alt="No video available"
                        className="object-contain w-16 h-16 mb-2 opacity-50" 
                      />
                      <span className="text-sm">Video yok</span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                      {lesson.title}
                    </h3>
                    <div className="ml-3 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full whitespace-nowrap">
                      #{lesson.order}
                    </div>
                  </div>
                  
                  {/* Content Preview */}
                  <div className="mb-4">
                    <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                      {lesson.content?.length > 120 
                        ? `${lesson.content.substring(0, 120)}...` 
                        : lesson.content || 'Bu ders için içerik bulunmamaktadır.'}
                    </p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <Link 
                      href={`/student/courses/${courseId}/lessons/${lesson.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-2 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-sm font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      Detaylar
                    </Link>
                    <button 
                      onClick={() => handleEditLesson(lesson.id)}
                      className="inline-flex items-center gap-1 border border-gray-300 bg-white text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      title="Dersi Düzenle"
                    >
                      <Edit className="h-4 w-4" />
                    </button> 
                    <button 
                      onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                      className="inline-flex items-center gap-1 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                      title="Dersi Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}