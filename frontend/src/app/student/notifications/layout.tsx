import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Bildirimler",
  description: "E-learning platformu bildirim listesi",
};

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 