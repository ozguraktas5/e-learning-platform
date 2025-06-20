import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Eğitmen Bildirimleri",
  description: "E-learning platformu eğitmen bildirim listesi",
};

export default function InstructorNotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 