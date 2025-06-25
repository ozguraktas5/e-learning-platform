'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import NotificationPopup from '@/components/notifications/NotificationPopup';
import { useNotifications } from '@/contexts/NotificationsContext';

// QueryClient oluştur
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// NotificationContainer bileşeni
function NotificationContainer() {
  const { isNotificationsOpen, closeNotifications } = useNotifications();
  
  return (
    <NotificationPopup 
      isOpen={isNotificationsOpen} 
      onClose={closeNotifications}
    />
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          <Navbar />
          {children}
          {/* Bildirim popup'ı Navbar'ın dışında render ediliyor */}
          <NotificationContainer />
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
} 