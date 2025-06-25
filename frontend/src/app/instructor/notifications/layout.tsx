import type { Metadata } from 'next';

export const metadata: Metadata = { //metadata için
  title: "Eğitmen Bildirimleri", 
  description: "E-learning platformu eğitmen bildirim listesi",
};

export default function InstructorNotificationsLayout({ //InstructorNotificationsLayout için
  children, //children için
}: { //children için
  children: React.ReactNode; //children için
}) {
  return children; //children için
} 