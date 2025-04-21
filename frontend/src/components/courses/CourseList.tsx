'use client';

import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '@/lib/api/courses';
import CourseCard from './CourseCard';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';

export default function CourseList() {
  const router = useRouter();
  
  const { data: courses = [], isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      try {
        return await coursesApi.getCourses();
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          toast.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
          router.push('/auth/login');
          return [];
        }
        console.error('Kurslar yüklenirken hata:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">
          Kurslar yüklenirken bir hata oluştu
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-lg text-gray-600 mb-2">
          Henüz hiç kurs bulunmuyor
        </div>
        <div className="text-sm text-gray-500">
          Daha sonra tekrar kontrol edin
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <Suspense key={course.id} fallback={<div className="bg-white rounded-lg shadow-md h-64 animate-pulse" />}>
          <CourseCard course={course} />
        </Suspense>
      ))}
    </div>
  );
} 