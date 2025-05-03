import { BASE_URL } from './api/index';

/**
 * Builds a full URL for media files, ensuring paths are correct
 * @param url Relative or absolute URL
 * @returns Full URL with proper path
 */
export const getFullUrl = (url: string): string => {
  if (!url) return '';
  
  // Replace media path with uploads
  const fixedUrl = url.replace('/media/', '/uploads/');
  
  // If already an absolute URL, return as is
  if (fixedUrl.startsWith('http')) return fixedUrl;
  
  // Otherwise prepend BASE_URL
  return `${BASE_URL}${fixedUrl}`;
}; 