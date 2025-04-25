'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Course } from '@/lib/api/courses';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="relative h-48">
          <Image
            src={course.image_url || '/placeholder-course.jpg'}
            alt={course.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2" dangerouslySetInnerHTML={{ __html: course.description }} />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Eğitmen: {course.instructor_name}
            </span>
            <span className="text-sm text-gray-500">
              {new Date(course.created_at).toLocaleDateString('tr-TR')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
} 