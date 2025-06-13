// Kurs seviyesi çeviri fonksiyonları

export const translateLevelToTurkish = (level: string): string => {
  switch (level.toLowerCase()) {
    case 'beginner':
      return 'Başlangıç';
    case 'intermediate':
      return 'Orta';
    case 'advanced':
      return 'İleri';
    default:
      return level; // Eğer çeviri bulunamazsa orijinal değeri döndür
  }
};

export const translateLevelToEnglish = (level: string): string => {
  switch (level) {
    case 'Başlangıç':
      return 'beginner';
    case 'Orta':
      return 'intermediate';
    case 'İleri':
      return 'advanced';
    default:
      return level.toLowerCase();
  }
};

export const getLevelBadgeColor = (level: string): string => {
  const turkishLevel = translateLevelToTurkish(level);
  switch (turkishLevel) {
    case 'Başlangıç':
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'Orta':
      return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    case 'İleri':
      return 'bg-purple-50 text-purple-600 border-purple-100';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-100';
  }
}; 