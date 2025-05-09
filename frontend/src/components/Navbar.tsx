'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import axios from 'axios';

// API URL'sini bir ortam değişkeninden veya yapılandırma dosyasından alabiliriz
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Okunmamış bildirim sayısını API'den alma
  useEffect(() => {
    // Kullanıcı giriş yapmamışsa bildirimleri yükleme
    if (!user) return;

    const fetchUnreadCount = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${API_URL}/api/notifications/unread-count`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setUnreadCount(response.data.count);
      } catch (err) {
        console.error('Bildirim sayısı alınamadı', err);
      } finally {
        setIsLoading(false);
      }
    };

    // İlk yükleme
    fetchUnreadCount();
    
    // Düzenli aralıklarla bildirimleri kontrol et (1 dakikada bir)
    const interval = setInterval(fetchUnreadCount, 60 * 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Kullanıcı rolüne göre profil URL'ini belirle
  const getProfileUrl = () => {
    if (user?.role === 'instructor') {
      return '/instructor/profile';
    }
    return '/profile';
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                E-Learning
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/courses"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                Kurslar
              </Link>
              {user?.role === 'instructor' && (
                <Link
                  href="/courses/create"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  Kurs Oluştur
                </Link>
              )}
              {user?.role === 'student' && (
                <Link
                  href="/my-courses"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  Kayıtlı Kurslarım
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-4">
                  <Link
                    href="/notifications"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600 relative"
                  >
                    <Bell className="h-5 w-5" />
                    {!isLoading && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 text-xs flex items-center justify-center bg-red-500 text-white rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user.username}
                  </span>
                  <Link
                    href={getProfileUrl()}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-150"
                  >
                    Profilim
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-150"
                  >
                    Çıkış Yap
                  </button>
                </div>
              </>
            ) : (
              <div className="flex space-x-4">
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
                >
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 