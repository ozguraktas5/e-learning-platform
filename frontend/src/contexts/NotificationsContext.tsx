'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'; // ReactNode ekledik
import axios from 'axios'; // axios kütüphanesini import ettik
import { useAuth } from './AuthContext'; // AuthContext'i import ettik

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"; // API_URL oluşturduk

interface NotificationsContextType { // NotificationsContextType interface'i oluşturduk
  isNotificationsOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
  unreadCount: number;
  isLoading: boolean;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined); // NotificationsContext oluşturduk

export function NotificationsProvider({ children }: { children: ReactNode }) { // NotificationsProvider fonksiyonu oluşturduk
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth(); // user'ı AuthContext'ten aldık

  const openNotifications = () => setIsNotificationsOpen(true);
  const closeNotifications = () => setIsNotificationsOpen(false);

  useEffect(() => { // useEffect fonksiyonu oluşturduk
    const fetchUnreadCount = async () => {
      // Sadece kullanıcı giriş yapmışsa sayımı al
      if (!user) {
        setUnreadCount(0);
        return;
      }

      setIsLoading(true);
      try {
        const token = localStorage.getItem('token'); // token'ı localStorage'ten aldık
        if (!token) {
          setUnreadCount(0);
          return;
        }

        const response = await axios.get(`${API_URL}/api/notifications/unread-count`, { // API_URL'i kullanarak unread-count endpoint'ine istek gönderdik
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setUnreadCount(response.data.count || 0);
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
        setUnreadCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    // Sadece kullanıcı giriş yapmışsa sayımı al
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [user]); // user'ı dependency olarak ekledik

  return (
    <NotificationsContext.Provider 
      value={{ 
        isNotificationsOpen, 
        openNotifications, 
        closeNotifications, 
        unreadCount, 
        isLoading 
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() { // useNotifications fonksiyonu oluşturduk
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
} 