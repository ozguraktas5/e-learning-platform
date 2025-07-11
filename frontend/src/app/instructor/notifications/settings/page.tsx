'use client';

import NotificationSettings from "@/components/notifications/NotificationSettings"; //NotificationSettings için
import { PageHeader } from "@/components/ui/page-header"; //PageHeader için
import { Settings } from "lucide-react"; //Settings için

export default function InstructorNotificationSettingsPage() { //InstructorNotificationSettingsPage için
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md">
              <Settings className="h-6 w-6" />
            </div>
            <PageHeader
              heading="Eğitmen Bildirim Ayarları"
              text="Eğitmen bildirim tercihlerinizi özelleştirin ve yönetin."
            />
          </div>
          <NotificationSettings />
        </div>
      </div>
    </div>
  );
} 