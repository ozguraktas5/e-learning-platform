"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CircleAlert, Bell, Settings, Trash2 } from "lucide-react";
import axios from "axios";

// API URL'sini bir ortam değişkeninden veya yapılandırma dosyasından alabiliriz
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string; 
  is_read: boolean; // API'den gelen alan adlarına uyum sağlıyoruz
  type: string;
  course_title?: string;
  created_at: string;
  read_at?: string;
}

export default function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bildirimleri API'den getir
  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Oturum açmanız gerekiyor.");
        setIsLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // API yanıtını işle
      const notificationsData = response.data.map((notification: any) => ({
        id: notification.id.toString(),
        title: notification.title,
        message: notification.message,
        date: notification.created_at,
        is_read: notification.is_read,
        type: notification.type || "info", // Eğer type yoksa varsayılan olarak "info" kullan
        course_title: notification.course_title,
        created_at: notification.created_at,
        read_at: notification.read_at
      }));

      setNotifications(notificationsData);
      setIsLoading(false);
    } catch (err: any) {
      console.error("Bildirimler yüklenirken hata oluştu:", err);
      setError(err.response?.data?.error || "Bildirimler yüklenirken bir hata oluştu.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Optimistik UI güncellemesi
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, is_read: true } 
            : notification
        )
      );

      // API'ye bildir
      await axios.put(`${API_URL}/api/notifications/${id}/read`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error("Bildirim okundu işaretlenirken hata oluştu:", err);
      // Hata durumunda orijinal verileri geri getir
      fetchNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Optimistik UI güncellemesi
      setNotifications(prev => prev.filter(notification => notification.id !== id));

      // API'ye bildir
      await axios.delete(`${API_URL}/api/notifications/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error("Bildirim silinirken hata oluştu:", err);
      // Hata durumunda orijinal verileri geri getir
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Optimistik UI güncellemesi
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );

      // API'ye bildir
      await axios.put(`${API_URL}/api/notifications/read-all`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error("Tüm bildirimler okundu işaretlenirken hata oluştu:", err);
      // Hata durumunda orijinal verileri geri getir
      fetchNotifications();
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-10">Yükleniyor...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>;
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case "info":
      case "course_update":
        return <Bell className="h-5 w-5 text-blue-500" />;
      case "warning":
      case "assignment_due":
        return <CircleAlert className="h-5 w-5 text-yellow-500" />;
      case "course":
      case "new_assignment":
        return <Bell className="h-5 w-5 text-green-500" />;
      case "new_quiz": 
        return <Bell className="h-5 w-5 text-emerald-500" />;
      case "system":
        return <Bell className="h-5 w-5 text-purple-500" />;
      case "quiz_graded":
      case "assignment_graded":
        return <Bell className="h-5 w-5 text-orange-500" />;
      case "assignment_submitted":
        return <Bell className="h-5 w-5 text-indigo-500" />;
      case "quiz_submitted":
        return <Bell className="h-5 w-5 text-pink-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tüm Bildirimler</h2>
        <div className="flex gap-4">
          <button 
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
            disabled={notifications.every(n => n.is_read)}
          >
            Tümünü okundu işaretle
          </button>
          <Link 
            href="/notifications/settings"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
          >
            <Settings className="h-4 w-4" />
            <span>Ayarlar</span>
          </Link>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          Henüz bildiriminiz bulunmamaktadır.
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div 
              key={notification.id}
              className={`p-4 border rounded-lg ${notification.is_read ? 'bg-white' : 'bg-blue-50'} flex items-start gap-3`}
            >
              <div className="flex-shrink-0 mt-1">
                {getIconForType(notification.type)}
              </div>
              <div 
                className="flex-1 cursor-pointer" 
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <div className="flex justify-between">
                  <h3 className={`font-medium ${notification.is_read ? '' : 'font-semibold'}`}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {formatDate(notification.date)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                {notification.course_title && (
                  <p className="text-xs text-gray-500 mt-1">
                    {notification.course_title}
                  </p>
                )}
              </div>
              <button 
                onClick={() => deleteNotification(notification.id)}
                className="text-gray-400 hover:text-red-500"
                aria-label="Bildirimi sil"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 