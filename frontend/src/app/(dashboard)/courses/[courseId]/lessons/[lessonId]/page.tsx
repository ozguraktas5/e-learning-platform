'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { lessonApi } from '@/lib/api/lessons';
import { Lesson } from '@/types/lesson';
import { useAuth } from '@/lib/hooks/useAuth';

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
    } catch (err) {
      setError('Ders detayları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Yükleniyor...</div>;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;
  if (!lesson) return <div className="text-center py-8">Ders bulunamadı</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">{lesson.title}</h1>

            {lesson.video_url && (
              <div className="mb-8">
                <video
                  controls
                  className="w-full rounded-lg"
                  src={lesson.video_url}
                >
                  Tarayıcınız video oynatmayı desteklemiyor.
                </video>
              </div>
            )}

            <div className="prose max-w-none mb-8">
              {lesson.content}
            </div>

            {lesson.documents.length > 0 && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Ders Dökümanları</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lesson.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <span className="flex-1">{doc.file_name}</span>
                      <span className="text-blue-600">İndir</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}