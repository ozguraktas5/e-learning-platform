"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import axios from "axios";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// API URL'sini bir ortam değişkeninden veya yapılandırma dosyasından alabiliriz
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface NotificationSetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: "course" | "system" | "marketing";
}

// Varsayılan ayarlar - gerçek uygulamada API'den gelecek
const defaultSettings: NotificationSetting[] = [
  {
    id: "1",
    name: "Yeni Kurs Bildirimleri",
    description: "İlgi alanlarınıza uygun yeni kurslar eklendiğinde bildirim alın.",
    enabled: true,
    category: "course"
  },
  {
    id: "2",
    name: "Ödev Hatırlatmaları",
    description: "Yaklaşan ödev teslim tarihleri için hatırlatma bildirimleri alın.",
    enabled: true,
    category: "course"
  },
  {
    id: "3",
    name: "Sistem Bildirimleri",
    description: "Bakım, güncelleme ve diğer sistem bildirimleri alın.",
    enabled: true,
    category: "system"
  },
  {
    id: "4",
    name: "E-posta Bildirimleri",
    description: "Bildirimler aynı zamanda e-posta adresinize de gönderilsin.",
    enabled: false,
    category: "system"
  },
  {
    id: "5",
    name: "Özel Teklifler",
    description: "Size özel indirim ve kampanya bildirimleri alın.",
    enabled: false,
    category: "marketing"
  }
];

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bildirim ayarlarını API'den getir
  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Oturum açmanız gerekiyor.");
        setIsLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/notifications/settings`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // API veri tipini uyumlu hale getir
      const settingsData = response.data.map((setting: any) => ({
        id: setting.id,
        name: setting.name,
        description: setting.description,
        enabled: setting.enabled, 
        category: setting.category as "course" | "system" | "marketing"
      }));
      
      setSettings(settingsData);
    } catch (err: any) {
      console.error("Bildirim ayarları yüklenirken hata oluştu:", err);
      setError(err.response?.data?.error || "Bildirim ayarları yüklenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggle = (id: string) => {
    setSettings(prevSettings =>
      prevSettings.map(setting =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const handleCategoryToggle = (category: NotificationSetting["category"], enabled: boolean) => {
    setSettings(prevSettings =>
      prevSettings.map(setting =>
        setting.category === category ? { ...setting, enabled } : setting
      )
    );
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSaveMessage({
          type: "error",
          text: "Oturum açmanız gerekiyor."
        });
        setIsSaving(false);
        return;
      }

      // API'ye ayarları gönder
      await axios.put(`${API_URL}/api/notifications/settings`, settings, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setSaveMessage({
        type: "success",
        text: "Bildirim ayarlarınız başarıyla kaydedildi."
      });
    } catch (err: any) {
      console.error("Ayarlar kaydedilirken hata oluştu:", err);
      setSaveMessage({
        type: "error",
        text: err.response?.data?.error || "Ayarlar kaydedilirken bir hata oluştu. Lütfen tekrar deneyin."
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="medium" />;
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-md">{error}</div>;
  }

  const categories = [
    { id: "course", label: "Kurs Bildirimleri" },
    { id: "system", label: "Sistem Bildirimleri" },
    { id: "marketing", label: "Pazarlama Bildirimleri" }
  ];

  return (
    <div className="space-y-8">
      {categories.map(category => {
        const categorySettings = settings.filter(setting => setting.category === category.id as NotificationSetting["category"]);
        const allEnabled = categorySettings.every(setting => setting.enabled);
        const someEnabled = categorySettings.some(setting => setting.enabled);
        
        // Eğer bu kategoride hiç ayar yoksa, kategoriyi gösterme
        if (categorySettings.length === 0) {
          return null;
        }
        
        return (
          <div key={category.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{category.label}</h3>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={someEnabled}
                  onChange={() => handleCategoryToggle(category.id as NotificationSetting["category"], !allEnabled)}
                />
                <div className={`relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 
                  ${someEnabled ? 'bg-blue-600' : 'bg-gray-200'} 
                  peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] 
                  after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {allEnabled ? "Tümü Açık" : someEnabled ? "Bazıları Açık" : "Tümü Kapalı"}
                </span>
              </label>
            </div>

            <div className="space-y-3 pl-2">
              {categorySettings.map(setting => (
                <div key={setting.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-medium">{setting.name}</h4>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={setting.enabled}
                      onChange={() => handleToggle(setting.id)}
                    />
                    <div className={`relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 
                      ${setting.enabled ? 'bg-blue-600' : 'bg-gray-200'} 
                      peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] 
                      after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="pt-4 border-t flex justify-end">
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Kaydediliyor..." : (
            <>
              <Save className="h-4 w-4" />
              <span>Ayarları Kaydet</span>
            </>
          )}
        </button>
      </div>

      {saveMessage && (
        <div className={`p-3 rounded-md ${saveMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {saveMessage.text}
        </div>
      )}
    </div>
  );
} 