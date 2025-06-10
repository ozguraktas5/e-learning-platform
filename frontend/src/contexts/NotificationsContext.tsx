'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface NotificationsContextType {
  isNotificationsOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
  unreadCount: number;
  isLoading: boolean;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth(); // Get user from AuthContext

  const openNotifications = () => setIsNotificationsOpen(true);
  const closeNotifications = () => setIsNotificationsOpen(false);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      // Only fetch if user is authenticated
      if (!user) {
        setUnreadCount(0);
        return;
      }

      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setUnreadCount(0);
          return;
        }

        const response = await axios.get(`${API_URL}/api/notifications/unread-count`, {
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

    // Only set up polling if user is authenticated
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [user]); // Add user as a dependency

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

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
} 