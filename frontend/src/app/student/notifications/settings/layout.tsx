import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Bildirim Ayarları | E-Learning Platform",
  description: "Bildirim tercihlerinizi özelleştirin ve hangi bildirimleri almak istediğinizi yönetin.",
};

export default function NotificationSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 