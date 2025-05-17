'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
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
        
        // API'den gelen bildirim listesini al ve ilk 5'ini göster
        const fetchedNotifications = response.data.notifications || [];
        setNotifications(fetchedNotifications.slice(0, 5));
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-start justify-end p-4">
        <div ref={popupRef} className="w-full max-w-md transform bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Bildirimler</h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <LoadingSpinner size="small" />
            )}
            {error ? (
              <div className="p-4 text-center text-red-500">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Bildirim bulunmuyor</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex space-x-3">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${!notification.is_read ? 'text-blue-600' : 'text-gray-900'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {(() => {
                            try {
                              const date = new Date(notification.created_at);
                              // Tarih geçerli mi kontrol et
                              if (isNaN(date.getTime())) {
                                return 'Geçersiz tarih';
                              }
                              return format(date, 'PPpp', { locale: tr });
                            } catch (error) {
                              console.error('Tarih formatlanırken hata oluştu:', error);
                              return 'Geçersiz tarih';
                            }
                          })()}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="border-t p-3 text-center">
            <button
              onClick={viewAllNotifications}
              className="w-full inline-flex justify-center text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Tüm bildirimleri görüntüle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 