import { Metadata } from "next";
import NotificationSettings from "@/components/notifications/NotificationSettings";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Bildirim Ayarları",
  description: "E-learning platformu bildirim ayarları",
};

export default function NotificationSettingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        heading="Bildirim Ayarları"
        text="Bildirim tercihlerinizi özelleştirin."
      />
      <NotificationSettings />
    </div>
  );
} 