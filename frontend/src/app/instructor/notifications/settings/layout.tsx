import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Eğitmen Bildirim Ayarları | E-Learning Platform",
  description: "Eğitmen bildirim tercihlerinizi özelleştirin ve hangi bildirimleri almak istediğinizi yönetin.",
};

export default function InstructorNotificationSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 