"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  CircleAlert, Bell, Settings, Trash2, CheckCircle, 
  Info, Book, Clock, FileText, 
  Zap, Calendar, RefreshCw
} from "lucide-react";
import axios from "axios";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// API URL'sini bir ortam değişkeninden veya yapılandırma dosyasından alabiliriz
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string; 
  is_read: boolean;
  type: string;
  course_title?: string;
  created_at: string;
  read_at?: string;
}

export default function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

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
      const notificationsData = response.data.notifications || [];
      setNotifications(notificationsData);
      setIsLoading(false);
    } catch (err: unknown) {
      console.error("Bildirimler yüklenirken hata oluştu:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Bildirimler yüklenirken bir hata oluştu.";
      setError(errorMessage);
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
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3">
        <CircleAlert className="h-5 w-5" />
        <div>{error}</div>
      </div>
    );
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "course_update":
        return <RefreshCw className="h-5 w-5 text-blue-500" />;
      case "warning":
        return <CircleAlert className="h-5 w-5 text-amber-500" />;
      case "assignment_due":
        return <Calendar className="h-5 w-5 text-amber-500" />;
      case "course":
        return <Book className="h-5 w-5 text-green-500" />;
      case "new_assignment":
        return <FileText className="h-5 w-5 text-green-500" />;
      case "new_quiz": 
        return <Zap className="h-5 w-5 text-emerald-500" />;
      case "system":
        return <Bell className="h-5 w-5 text-purple-500" />;
      case "quiz_graded":
      case "assignment_graded":
        return <CheckCircle className="h-5 w-5 text-orange-500" />;
      case "assignment_submitted":
        return <FileText className="h-5 w-5 text-indigo-500" />;
      case "quiz_submitted":
        return <Zap className="h-5 w-5 text-pink-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
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

  const getColorForType = (type: string) => {
    switch (type) {
      case "info":
      case "course_update":
        return "bg-blue-50 border-blue-100";
      case "warning":
      case "assignment_due":
        return "bg-amber-50 border-amber-100";
      case "course":
      case "new_assignment":
        return "bg-green-50 border-green-100";
      case "new_quiz": 
        return "bg-emerald-50 border-emerald-100";
      case "system":
        return "bg-purple-50 border-purple-100";
      case "quiz_graded":
      case "assignment_graded":
        return "bg-orange-50 border-orange-100";
      case "assignment_submitted":
        return "bg-indigo-50 border-indigo-100";
      case "quiz_submitted":
        return "bg-pink-50 border-pink-100";
      default:
        return "bg-gray-50 border-gray-100";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return "Şimdi";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} dakika önce`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} saat önce`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} gün önce`;
    } else {
      return formatDate(dateString);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'read') return notification.is_read;
    if (filter === 'unread') return !notification.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/70 p-4 rounded-xl border border-gray-100">
        <div>
          <h2 className="text-lg font-medium text-gray-800">
            Bildirimleriniz 
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {unreadCount} okunmamış
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Kurs, ödev ve sistem bildirimlerinizi görüntüleyin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1.5 bg-white">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === 'all' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === 'unread' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Okunmamış
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === 'read' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Okunmuş
            </button>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={markAllAsRead}
              disabled={notifications.every(n => n.is_read)}
              className="flex items-center gap-1 py-2 px-3 text-sm font-medium rounded-lg bg-white border border-gray-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Tümünü Okundu İşaretle</span>
            </button>
            
            <Link 
              href="/student/notifications/settings"
              className="flex items-center gap-1 py-2 px-3 text-sm font-medium rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
            >
              <Settings className="h-4 w-4" />
              <span>Ayarlar</span>
            </Link>
          </div>
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="p-4 bg-indigo-50 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Bildirim Bulunamadı</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {filter !== 'all' 
              ? `Seçtiğiniz filtreye uygun bildirim bulunmuyor. Farklı bir filtre seçmeyi deneyin.`
              : `Henüz bildiriminiz bulunmamaktadır. Aktiviteleriniz ve kurs güncellemeleri burada görünecektir.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div 
              key={notification.id}
              className={`border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${
                !notification.is_read ? getColorForType(notification.type) : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start p-0">
                <div className={`${!notification.is_read ? 'bg-white/40' : 'bg-gray-50/40'} p-4 sm:p-5 flex items-start gap-4 flex-1`}>
                  <div className={`flex-shrink-0 p-2.5 rounded-full ${
                    !notification.is_read ? 'bg-white' : 'bg-white'
                  } shadow-sm border border-gray-100`}>
                    {getIconForType(notification.type)}
                  </div>
                  <div 
                    className="flex-1 cursor-pointer" 
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex justify-between items-start flex-col sm:flex-row gap-1 sm:gap-2">
                      <h3 className={`font-medium text-gray-900 ${notification.is_read ? '' : 'font-semibold'}`}>
                        {notification.title}
                        {!notification.is_read && (
                          <span className="inline-block ml-2 w-2 h-2 bg-indigo-600 rounded-full"></span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2">
                        {notification.course_title && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 whitespace-nowrap">
                            <Book className="h-3 w-3 mr-1" />
                            {notification.course_title}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 whitespace-nowrap flex items-center">
                          <Clock className="inline-block mr-1 h-3 w-3" />
                          {formatTimeAgo(notification.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{notification.message}</p>
                  </div>
                </div>
                <div className={`flex justify-end items-center pl-4 pr-4 py-3 border-t sm:border-t-0 sm:border-l ${!notification.is_read ? 'border-t-gray-100 sm:border-l-gray-100' : 'border-t-gray-100 sm:border-l-gray-100'}`}>
                  <button 
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    aria-label="Bildirimi sil"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 