'use client';

import { Course } from '@/lib/api/courses';

interface CourseListProps {
  courses: Course[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
  onPageChange: (page: number) => void;
}

export default function CourseList({ courses, pagination, onPageChange }: CourseListProps) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Henüz hiç kurs bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {course.image_url && (
              <img
                src={course.image_url}
                alt={course.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
              <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-blue-600 font-medium">
                  {course.price ? `${course.price} TL` : 'Ücretsiz'}
                </span>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Detaylar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pagination.total_pages > 1 && (
        <div className="flex justify-center space-x-2">
          {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-4 py-2 rounded-md ${
                page === pagination.page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 