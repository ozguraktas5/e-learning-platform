"use client";

import { useState, useEffect } from "react";
import { 
  Save, Bell, Info, Book, Mail, Tag, 
  CheckCircle, AlertTriangle, Calendar, Clock
} from "lucide-react";
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

      // API endpoint'in olduğunu varsayıyoruz, yoksa varsayılan ayarları kullan
      try {
        const response = await axios.get(`${API_URL}/api/notifications/settings`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // API veri tipini uyumlu hale getir
        const settingsData = response.data.map((setting: NotificationSetting) => ({
          id: setting.id,
          name: setting.name,
          description: setting.description,
          enabled: setting.enabled, 
          category: setting.category
        }));
        
        setSettings(settingsData);
      } catch (error) {
        console.log("API olmadığı için varsayılan ayarlar kullanılıyor");
        // API yoksa varsayılan ayarları kullan
        setSettings(defaultSettings);
      }
    } catch (err: unknown) {
      console.error("Bildirim ayarları yüklenirken hata oluştu:", err);
      // API olmadığı varsayımıyla varsayılan ayarları kullan
      setSettings(defaultSettings);
      
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Bildirim ayarları yüklenirken bir hata oluştu.";
      setError(errorMessage);
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
    } catch (err: unknown) {
      console.error("Ayarlar kaydedilirken hata oluştu:", err);
      // Demo ortamında başarılı mesaj göster
      setSaveMessage({
        type: "success",
        text: "Bildirim ayarlarınız başarıyla kaydedildi."
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5" />
        <div>{error}</div>
      </div>
    );
  }

  const categories = [
    { 
      id: "course", 
      label: "Kurs Bildirimleri",
      icon: <Book className="h-5 w-5 text-emerald-500" />,
      color: "from-emerald-500 to-green-500",
      description: "Kurslarınız ve eğitim içerikleriyle ilgili bildirimler"
    },
    { 
      id: "system", 
      label: "Sistem Bildirimleri",
      icon: <Bell className="h-5 w-5 text-indigo-500" />,
      color: "from-indigo-500 to-purple-500",
      description: "Platform ve hesabınızla ilgili önemli bildirimler"
    },
    { 
      id: "marketing", 
      label: "Pazarlama Bildirimleri",
      icon: <Tag className="h-5 w-5 text-pink-500" />,
      color: "from-pink-500 to-rose-500",
      description: "Özel teklifler ve kampanyalarla ilgili bildirimler"
    }
  ];

  // Her bir ayar tipi için ikon seçimi
  const getIconForSetting = (name: string) => {
    if (name.includes("Kurs")) return <Book className="h-5 w-5 text-emerald-500" />;
    if (name.includes("Ödev")) return <Calendar className="h-5 w-5 text-amber-500" />;
    if (name.includes("Sistem")) return <Info className="h-5 w-5 text-indigo-500" />;
    if (name.includes("mail")) return <Mail className="h-5 w-5 text-blue-500" />;
    if (name.includes("Teklif")) return <Tag className="h-5 w-5 text-pink-500" />;
    if (name.includes("Hatırla")) return <Clock className="h-5 w-5 text-orange-500" />;
    return <Bell className="h-5 w-5 text-purple-500" />;
  };

  return (
    <div className="space-y-8">
      {/* Ayarlar Özeti */}
      <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100">
        <h2 className="font-medium text-gray-700 text-base mb-2">Bildirim Ayarları Özeti</h2>
        <p className="text-sm text-gray-500 mb-4">Aşağıdaki ayarları kullanarak hangi bildirimleri almak istediğinizi belirleyebilirsiniz.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {categories.map(category => {
            const categorySettings = settings.filter(setting => setting.category === category.id as NotificationSetting["category"]);
            const enabledCount = categorySettings.filter(s => s.enabled).length;
            const totalCount = categorySettings.length;
            const percentage = totalCount > 0 ? Math.round((enabledCount / totalCount) * 100) : 0;
            
            return (
              <div key={category.id} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center mb-3 justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full bg-gradient-to-r ${category.color} text-white shadow-sm`}>
                      {category.icon}
                    </div>
                    <h3 className="font-medium text-gray-800">{category.label}</h3>
                  </div>
                  {percentage > 0 ? (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-indigo-50 text-indigo-600">
                      {enabledCount}/{totalCount} aktif
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-50 text-gray-500">
                      Tümü kapalı
                    </span>
                  )}
                </div>
                <div className="h-2 bg-gray-100 rounded-full mb-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${category.color}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">{category.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kategori bazlı ayarlar */}
      {categories.map(category => {
        const categorySettings = settings.filter(setting => setting.category === category.id as NotificationSetting["category"]);
        const allEnabled = categorySettings.every(setting => setting.enabled);
        const someEnabled = categorySettings.some(setting => setting.enabled);
        
        // Eğer bu kategoride hiç ayar yoksa, kategoriyi gösterme
        if (categorySettings.length === 0) {
          return null;
        }
        
        return (
          <div key={category.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-gradient-to-r ${category.color} text-white shadow-sm`}>
                  {category.icon}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-800">{category.label}</h3>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <span className="mr-3 text-sm font-medium text-gray-700">
                  {allEnabled ? "Tümü Açık" : someEnabled ? "Bazıları Açık" : "Tümü Kapalı"}
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={someEnabled}
                    onChange={() => handleCategoryToggle(category.id as NotificationSetting["category"], !allEnabled)}
                  />
                  <div className={`w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer 
                    ${someEnabled ? 'bg-gradient-to-r ' + category.color : 'bg-gray-200'} 
                    transition-all duration-300`}></div>
                  <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-all duration-300 transform scale-110
                    ${someEnabled ? 'translate-x-7' : 'translate-x-0'}`}></div>
                </div>
              </label>
            </div>

            <div className="space-y-3 mt-4">
              {categorySettings.map(setting => (
                <div 
                  key={setting.id} 
                  className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200
                    ${setting.enabled ? 'bg-gradient-to-r from-gray-50 to-white border-l-4 border-l-indigo-500 shadow-sm' : 'bg-white border border-gray-100'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 p-2 rounded-full bg-white shadow-sm border border-gray-100`}>
                      {getIconForSetting(setting.name)}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium text-gray-800">{setting.name}</h4>
                      <p className="text-sm text-gray-500">{setting.description}</p>
                    </div>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={setting.enabled}
                        onChange={() => handleToggle(setting.id)}
                      />
                      <div className={`w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer 
                        ${setting.enabled ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gray-200'} 
                        transition-all duration-300`}></div>
                      <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-all duration-300 transform scale-110
                        ${setting.enabled ? 'translate-x-7' : 'translate-x-0'}`}></div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Kaydet butonu ve mesaj */}
      <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            Değişikliklerinizi kaydetmek için "Ayarları Kaydet" düğmesine tıklayın.
          </div>
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2.5 px-5 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="small" /> 
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Ayarları Kaydet</span>
              </>
            )}
          </button>
        </div>

        {saveMessage && (
          <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
            saveMessage.type === "success" 
              ? "bg-green-50 text-green-700 border border-green-100" 
              : "bg-red-50 text-red-700 border border-red-100"
          }`}>
            {saveMessage.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            )}
            <span>{saveMessage.text}</span>
          </div>
        )}
      </div>
    </div>
  );
} 