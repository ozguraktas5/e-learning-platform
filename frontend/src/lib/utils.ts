import { BASE_URL } from './api/index';

export const getFullUrl = (url: string): string => { // getFullUrl fonksiyonu oluşturduk
  if (!url) return '';
  
  const fixedUrl = url.replace('/media/', '/uploads/'); // media yolunu uploads yoluna değiştirdik
  
  if (fixedUrl.startsWith('http')) return fixedUrl; // eğer url http ile başlıyorsa, url'i döndür
  
  return `${BASE_URL}${fixedUrl}`; // BASE_URL ile url'i birleştir ve döndür
}; 