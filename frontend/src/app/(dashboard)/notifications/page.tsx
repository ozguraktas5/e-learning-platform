import { Metadata } from "next";
import NotificationList from "@/components/notifications/NotificationList";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Bildirimler",
  description: "E-learning platformu bildirim listesi",
};

export default function NotificationsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        heading="Bildirimler"
        text="Tüm bildirimleri görüntüleyin ve yönetin."
      />
      <NotificationList />
    </div>
  );
} 