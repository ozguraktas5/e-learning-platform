'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">E-Learning</h3>
            <p className="text-gray-600 text-sm">
              Kariyerinizde ilerlemek ve yeni beceriler öğrenmek için en iyi online eğitim platformu.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı Bağlantılar</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 hover:text-blue-600 text-sm">
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-gray-600 hover:text-blue-600 text-sm">
                  Kurslar
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-blue-600 text-sm">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-blue-600 text-sm">
                  İletişim
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">İletişim</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Email: iletisim@elearning.com</li>
              <li>Telefon: +90 212 123 45 67</li>
              <li>Adres: İstanbul, Türkiye</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600">
            © {currentYear} E-Learning Platform. Tüm hakları saklıdır.
          </p>
          <div className="mt-4 md:mt-0">
            <ul className="flex space-x-4">
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-blue-600">
                  Kullanım Şartları
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-blue-600">
                  Gizlilik Politikası
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
} 