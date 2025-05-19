'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import NotificationPopup from '@/components/notifications/NotificationPopup';
import { useNotifications } from '@/contexts/NotificationsContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// Component that uses the NotificationsContext
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
          {/* Notification popup rendering outside of Navbar */}
          <NotificationContainer />
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
} 