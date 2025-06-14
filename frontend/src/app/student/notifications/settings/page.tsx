'use client';

import NotificationSettings from "@/components/notifications/NotificationSettings";
import { PageHeader } from "@/components/ui/page-header";
import { Settings } from "lucide-react";

export default function NotificationSettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md">
              <Settings className="h-6 w-6" />
            </div>
            <PageHeader
              heading="Bildirim Ayarları"
              text="Bildirim tercihlerinizi özelleştirin ve yönetin."
            />
          </div>
          <NotificationSettings />
        </div>
      </div>
    </div>
  );
} 