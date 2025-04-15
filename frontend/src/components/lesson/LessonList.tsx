'use client';

import { useState } from 'react';
import { Lesson } from '@/types/lesson';
import { useRouter } from 'next/navigation';

interface LessonListProps {
  lessons: Lesson[];
  courseId: number;
  currentLessonId?: number;
  isInstructor: boolean;
}

export default function LessonList({ lessons, courseId, currentLessonId, isInstructor }: LessonListProps) {
  const router = useRouter();
  const [expandedLesson, setExpandedLesson] = useState<number | null>(currentLessonId || null);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Dersler</h2>
        {isInstructor && (
          <button
            onClick={() => router.push(`/courses/${courseId}/lessons/create`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Yeni Ders Ekle
          </button>
        )}
      </div>

      {lessons.map((lesson) => (
        <div
          key={lesson.id}
          className={`border rounded-lg ${
            currentLessonId === lesson.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
        >
          <div
            className="p-4 cursor-pointer flex justify-between items-center"
            onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
          >
            <div className="flex items-center space-x-2">
              <span className="font-medium">{lesson.title}</span>
              {lesson.video_url && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Video
                </span>
              )}
            </div>
            <span className="text-gray-500">{lesson.order}. Ders</span>
          </div>

          {expandedLesson === lesson.id && (
            <div className="p-4 border-t border-gray-200">
              <p className="text-gray-600 mb-4">{lesson.content}</p>
              
              {lesson.documents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Dökümanlar:</h4>
                  {lesson.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:underline"
                    >
                      {doc.file_name}
                    </a>
                  ))}
                </div>
              )}

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => router.push(`/courses/${courseId}/lessons/${lesson.id}`)}
                  className="text-blue-600 hover:underline"
                >
                  Derse Git
                </button>
                {isInstructor && (
                  <button
                    onClick={() => router.push(`/courses/${courseId}/lessons/${lesson.id}/edit`)}
                    className="text-green-600 hover:underline"
                  >
                    Düzenle
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}