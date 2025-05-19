'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { X, Bell, Info, MessageSquare, CheckCircle, AlertTriangle, MoreHorizontal, ExternalLink } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  link?: string;
  type?: string;
  course_title?: string;
}

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPopup({ isOpen, onClose }: NotificationPopupProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Popup dışına tıklandığında kapat
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Oturum açmanız gerekiyor');
          return;
        }

        const response = await axios.get(`${API_URL}/api/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // API'den gelen bildirim listesini al ve ilk 8'ini göster (daha fazla göster)
        const fetchedNotifications = response.data.notifications || [];
        setNotifications(fetchedNotifications.slice(0, 8));
      } catch (err) {
        console.error('Bildirimler alınamadı', err);
        setError('Bildirimler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token bulunamadı');
        return;
      }

      // Bildirimi önce UI'da güncelle (optimistic update)
      setNotifications(notifications.map(notif => 
        notif.id === id ? { ...notif, is_read: true } : notif
      ));
      
      console.log(`Bildirim ${id} için istek gönderiliyor...`);
      
      // Doğru endpoint ve HTTP metodunu kullan (PUT)
      await axios.put(`${API_URL}/api/notifications/${id}/read`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 10000, // 10 saniye zaman aşımı
      });
      
      console.log(`Bildirim ${id} okundu olarak işaretlendi`);
    } catch (err) {
      console.error('Bildirim okundu olarak işaretlenemedi', err);
      // Hata mesajını daha detaylı loglayalım
      if (axios.isAxiosError(err)) {
        console.error('Hata detayları:', {
          message: err.message,
          code: err.code,
          status: err.response?.status,
          data: err.response?.data
        });
      }
      // UI güncellemesi zaten yapıldı (optimistic update)
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Önce link kontrolü yap
    if (notification.link) {
      router.push(notification.link);
      onClose();
    }
    
    // Sonra okundu işaretle (UI'da öncelik)
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  const viewAllNotifications = () => {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'student') {
      router.push('/student/notifications');
    } else {
      router.push('/notifications');
    }
    onClose();
  };

  // Bildirim türüne göre ikon seçimi
  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-indigo-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          ref={popupRef} 
          className="w-full max-w-md transform bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: 'calc(100vh - 40px)' }}
        >
          <div className="flex items-center justify-between p-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                Bildirimler
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white text-gray-500 hover:text-indigo-600 transition-colors duration-200 border border-gray-100 hover:border-indigo-200 shadow-sm"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
            {loading ? (
              <div className="flex items-center justify-center p-10">
                <LoadingSpinner size="small" />
                <span className="ml-3 text-sm text-gray-500">Bildirimler yükleniyor...</span>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <p className="text-sm font-medium text-red-500">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-3 text-xs text-gray-500 hover:text-indigo-600"
                >
                  Yeniden yükle
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center">
                <div className="p-6 bg-indigo-50 rounded-full mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-indigo-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">Henüz bildiriminiz bulunmuyor</p>
                <p className="text-xs text-gray-500 mt-1 mb-6">Yeni bildirimler geldiğinde burada görünecek</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id}
                    className={`p-5 hover:bg-indigo-50/40 cursor-pointer transition-colors duration-150
                      ${!notification.is_read ? 'bg-indigo-50/70 border-l-4 border-indigo-500' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex space-x-3">
                      <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full 
                        ${!notification.is_read ? 'bg-white' : 'bg-gray-50'} shadow-sm border border-gray-100`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <p className={`text-sm font-semibold ${!notification.is_read ? 'text-indigo-700' : 'text-gray-800'}`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center">
                            {!notification.is_read && (
                              <div className="h-2.5 w-2.5 rounded-full bg-indigo-600 mr-2"></div>
                            )}
                            <div className="text-xs text-gray-400 whitespace-nowrap">
                              {(() => {
                                try {
                                  const date = new Date(notification.created_at);
                                  if (isNaN(date.getTime())) return 'Geçersiz tarih';
                                  
                                  // Sadece saat veya tarih göster
                                  const today = new Date();
                                  const isToday = date.getDate() === today.getDate() && 
                                    date.getMonth() === today.getMonth() && 
                                    date.getFullYear() === today.getFullYear();
                                    
                                  return isToday 
                                    ? format(date, 'HH:mm', { locale: tr })
                                    : format(date, 'dd MMM', { locale: tr });
                                } catch (error) {
                                  console.error('Tarih formatlanırken hata oluştu:', error);
                                  return 'Geçersiz tarih';
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        {notification.course_title && (
                          <div className="mt-2 flex items-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                              {notification.course_title}
                            </span>
                          </div>
                        )}
                        
                        {notification.link && (
                          <div className="mt-3 flex">
                            <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                              <span>Görüntüle</span>
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="border-t border-indigo-100 p-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
            <button
              onClick={viewAllNotifications}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium text-sm shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
            >
              <span>Tüm Bildirimleri Görüntüle</span>
              <MoreHorizontal className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 