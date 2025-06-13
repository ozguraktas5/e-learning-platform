'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { lessonApi } from '@/lib/api/lessons';
import { Lesson } from '@/types/lesson';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { Book, FileText, ArrowLeft, HelpCircle, ClipboardList, Download } from 'lucide-react';

export default function LessonDetailPage() {
  const { courseId, lessonId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetchLessonDetails();
  }, [courseId, lessonId]);

  const fetchLessonDetails = async () => {
    try {
      setLoading(true);
      const data = await lessonApi.getLesson(Number(courseId), Number(lessonId));
      setLesson(data);
    } catch (error) {
      console.error('Error loading lesson details:', error);
      setError('Ders detayları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const navigateToQuizzes = () => {
    router.push(`/student/courses/${courseId}/lessons/${lessonId}/quizzes`);
  };
  
  const createNewQuiz = () => {
    router.push(`/student/courses/${courseId}/lessons/${lessonId}/quiz/create`);
  };

  const navigateToAssignments = () => {
    router.push(`/student/courses/${courseId}/lessons/${lessonId}/assignments`);
  };

  if (loading) return <LoadingSpinner size="medium" fullScreen />;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;
  if (!lesson) return <div className="text-center py-8">Ders bulunamadı</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
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
                    {lesson.title}
                  </h1>
                  <p className="text-gray-600 mt-1">Ders detaylarını görüntüleyin</p>
                </div>
              </div>
              <Book className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Content Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-indigo-50 overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center">
                  <Book className="h-6 w-6 mr-2 text-indigo-600" />
                  Ders İçeriği
                </h2>
              </div>
              <div className="p-6">
                <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed">
                  {lesson.content}
                </div>
              </div>
            </div>

            {/* Documents Section */}
            {lesson.documents.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-indigo-50 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center">
                    <FileText className="h-6 w-6 mr-2 text-indigo-600" />
                    Ders Dökümanları
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-4">
                    {lesson.documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg hover:shadow-md transition-all duration-300 group"
                      >
                        <Download className="h-5 w-5 text-indigo-600 mr-3" />
                        <span className="flex-1 font-medium text-gray-800 group-hover:text-indigo-600">{doc.file_name}</span>
                        <span className="text-indigo-600 font-medium">İndir</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-indigo-50 overflow-hidden sticky top-6">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Ders Aktiviteleri
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {/* Quiz Button */}
                <button 
                  onClick={navigateToQuizzes}
                  className="w-full flex items-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg hover:shadow-md transition-all duration-300 text-left group"
                >
                  <div className="p-2 rounded-full bg-indigo-100 mr-3 group-hover:bg-indigo-200">
                    <HelpCircle className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 group-hover:text-indigo-600">Sınavlar</span>
                    <p className="text-sm text-gray-600">Ders Sınavlarını Görüntüle</p>
                  </div>
                </button>

                {/* Assignments Button */}
                <button 
                  onClick={navigateToAssignments}
                  className="w-full flex items-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-lg hover:shadow-md transition-all duration-300 text-left group"
                >
                  <div className="p-2 rounded-full bg-emerald-100 mr-3 group-hover:bg-emerald-200">
                    <ClipboardList className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 group-hover:text-emerald-600">Ödevler</span>
                    <p className="text-sm text-gray-600">Ders Ödevlerini Görüntüle</p>
                  </div>
                </button>

                {/* Instructor only buttons */}
                {user?.role === 'instructor' && (
                  <>
                    <button 
                      onClick={createNewQuiz}
                      className="w-full flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg hover:shadow-md transition-all duration-300 text-left group"
                    >
                      <div className="p-2 rounded-full bg-blue-100 mr-3 group-hover:bg-blue-200">
                        <HelpCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-800 group-hover:text-blue-600">Sınav Oluştur</span>
                        <p className="text-sm text-gray-600">Yeni Sınav Ekle</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => router.push(`/student/courses/${courseId}/lessons/${lessonId}/assignment/create`)}
                      className="w-full flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-lg hover:shadow-md transition-all duration-300 text-left group"
                    >
                      <div className="p-2 rounded-full bg-green-100 mr-3 group-hover:bg-green-200">
                        <ClipboardList className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-800 group-hover:text-green-600">Ödev Oluştur</span>
                        <p className="text-sm text-gray-600">Yeni Ödev Ekle</p>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}