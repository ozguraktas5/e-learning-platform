import type { Metadata } from 'next';

export const metadata: Metadata = { //metadata için
  title: "Eğitmen Bildirim Ayarları | E-Learning Platform",
  description: "Eğitmen bildirim tercihlerinizi özelleştirin ve hangi bildirimleri almak istediğinizi yönetin.",
};

export default function InstructorNotificationSettingsLayout({ //InstructorNotificationSettingsLayout için
  children, //children için
}: { //children için
  children: React.ReactNode; //children için
}) {
  return children; //children için
} 