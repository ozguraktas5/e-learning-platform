'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
// Assuming you have an API function to get lessons for a course
// Adjust the import path and function name if necessary
import { coursesApi, Lesson } from '@/lib/api/courses'; 
import Link from 'next/link';
import no_video from '../../../../../../../uploads/no_video.png';
import Image from 'next/image';

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

  if (loading) {
    return <div className="p-4">Loading lessons...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Lessons for: {courseTitle || `Course ${courseId}`}
        </h1>
        {/* TODO: Link to a page/modal for adding a new lesson */}
        <Link href={`/courses/${courseId}/lessons/create`} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Add New Lesson
        </Link>
      </div>

      {lessons.length === 0 ? (
        <p>No lessons found for this course yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((lesson) => (
            <div 
              key={lesson.id} 
              className="border rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow duration-200 bg-white flex flex-col"
            >
              {/* Conditional Video/Image Display */}
              <div className="aspect-video bg-gray-200 flex items-center justify-center overflow-hidden">
                {lesson.video_url ? (
                  <video 
                    src={lesson.video_url} 
                    controls 
                    muted // Start muted to avoid autoplay issues
                    playsInline // Important for mobile playback
                    preload="metadata" // Load only metadata initially for faster page load
                    className="object-cover w-full h-full" // Use object-cover for aspect ratio
                    title={lesson.title} // Add title for accessibility
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : ( // Show no_video image if no video exists
                  <Image 
                    src={no_video}
                    alt="No video available"
                    className="object-contain w-1/2 h-1/2" 
                  />
                )}
              </div>

              {/* Card Content */}
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold mb-2 flex-grow">{lesson.title}</h3>
                
                {/* Buttons at the bottom */}
                <div className="flex justify-end space-x-2 mt-4">
                   <button className="border border-gray-300 hover:bg-gray-100 text-gray-800 font-semibold py-1 px-3 rounded text-sm">Edit</button> 
                   <button className="bg-red-500 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded text-sm">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Placeholder for Lesson type if not defined in coursesApi
// interface Lesson {
//   id: number;
//   title: string;
//   // Add other relevant lesson properties
// } 