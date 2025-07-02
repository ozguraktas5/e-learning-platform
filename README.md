# 🎓 E-Learning Platformu

Modern, kullanıcı dostu çevrimiçi eğitim platformu. Öğrenciler ve eğitmenler için kapsamlı öğrenme yönetim sistemi.

## 🚀 Canlı Demo

**🌐 [Canlı Demo](https://determined-reflection-production.up.railway.app/)**

## 📸 Ekran Görüntüleri

*Proje ekran görüntüleri buraya eklenebilir*

## ✨ Özellikler

### 👨‍🎓 Öğrenci Özellikleri
- ✅ Kullanıcı kaydı ve giriş sistemi
- ✅ Kurslara kayıt olma ve ilerleme takibi
- ✅ Video dersleri izleme
- ✅ Ödev ve sınav yapma
- ✅ Kurs değerlendirme ve yorum sistemi
- ✅ Kişisel profil yönetimi
- ✅ Bildirim sistemi

### 👨‍🏫 Eğitmen Özellikleri
- ✅ Kurs oluşturma ve yönetimi
- ✅ Video/dosya yükleme sistemi
- ✅ Ödev ve sınav oluşturma
- ✅ Öğrenci ilerleme takibi
- ✅ Değerlendirmelere yanıt verme
- ✅ Kontrol paneli ve analitikler
- ✅ Öğrenci mesajlaşma sistemi

### 🛠️ Teknik Özellikler
- ✅ Duyarlı tasarım (mobil öncelikli)
- ✅ JWT tabanlı güvenli kimlik doğrulama
- ✅ Dosya yükleme ve video akışı
- ✅ Gerçek zamanlı bildirimler
- ✅ Rol tabanlı erişim kontrolü
- ✅ Veritabanı geçişleri
- ✅ API dokümantasyonu

## 🛠️ Teknoloji Yığını

### 🎨 Ön Yüz
| Teknoloji | Açıklama | Kullanım Amacı |
|-----------|----------|----------------|
| **Next.js 14** | React tabanlı tam yığın çerçevesi | Sunucu tarafı oluşturma, yönlendirme, performans optimizasyonu |
| **TypeScript** | JavaScript'in tip güvenli versiyonu | Kod kalitesi, IntelliSense, hata önleme |
| **Tailwind CSS** | Yardımcı sınıf öncelikli CSS çerçevesi | Hızlı stillendirme, duyarlı tasarım, modern arayüz |
| **Lucide React** | Modern simge kütüphanesi | Tutarlı ve güzel simgeler |
| **React Hook Form** | Form yönetim kütüphanesi | Performanslı form doğrulama ve yönetimi |
| **Zod** | Şema doğrulama kütüphanesi | TypeScript öncelikli veri doğrulama |
| **Axios** | HTTP istemci kütüphanesi | API istekleri, yakalayıcılar, hata yönetimi |
| **React Toastify** | Bildirim kütüphanesi | Kullanıcı bildirimleri ve geri bildirim |

### ⚙️ Arka Yüz
| Teknoloji | Açıklama | Kullanım Amacı |
|-----------|----------|----------------|
| **Flask** | Python web çerçevesi | RESTful API geliştirme, arka yüz mantığı |
| **SQLAlchemy** | Python ORM kütüphanesi | Veritabanı modelleme, sorgu optimizasyonu |
| **Flask-JWT-Extended** | JWT kimlik doğrulama | Güvenli token tabanlı kimlik doğrulama |
| **Flask-CORS** | Çapraz Kaynak Paylaşımı | Ön yüz-arka yüz iletişimi |
| **Flask-Migrate** | Veritabanı geçişi | Şema değişiklikleri, sürüm kontrolü |
| **Werkzeug** | WSGI yardımcı kütüphanesi | Şifre özetleme, güvenlik araçları |
| **Python-dotenv** | Ortam değişkeni yükleyicisi | Yapılandırma yönetimi |

### 🗄️ Veritabanı
| Teknoloji | Açıklama | Kullanım Amacı |
|-----------|----------|----------------|
| **PostgreSQL** | Üretim veritabanı | Güvenilir, ölçeklenebilir veri saklama |
| **SQLite** | Geliştirme veritabanı | Yerel geliştirme, test etme |

### 🚀 Dağıtım ve DevOps
| Teknoloji | Açıklama | Kullanım Amacı |
|-----------|----------|----------------|
| **Railway** | Bulut platformu | Tam yığın dağıtım, veritabanı barındırma |
| **Git** | Sürüm kontrolü | Kod sürümleme, işbirliği |

## 🏗️ Proje Yapısı

```
e-learning-platform/
├── frontend/                 # Next.js ön yüz uygulaması
│   ├── src/
│   │   ├── app/             # Next.js 13+ App Router
│   │   ├── components/      # Yeniden kullanılabilir React bileşenleri
│   │   ├── contexts/        # React Context sağlayıcıları
│   │   ├── hooks/           # Özel React hook'ları
│   │   ├── lib/             # Yardımcılar, API istemcileri
│   │   └── types/           # TypeScript tip tanımları
│   ├── public/              # Statik varlıklar
│   └── package.json
├── backend/                 # Flask arka yüz API'si
│   ├── models.py            # Veritabanı modelleri
│   ├── auth.py              # Kimlik doğrulama rotaları
│   ├── courses.py           # Kurs yönetimi
│   ├── profiles.py          # Kullanıcı profil yönetimi
│   ├── assignments.py       # Ödev sistemi
│   ├── notifications.py     # Bildirim sistemi
│   ├── migrations/          # Veritabanı geçişleri
│   └── requirements.txt
└── README.md
```

## 🚀 Kurulum ve Çalıştırma

### Ön Koşullar
- **Node.js** (v18+)
- **Python** (v3.8+)
- **PostgreSQL** (üretim için)

### 1. Depoyu klonlayın
```bash
git clone https://github.com/ozguraktas5/e-learning-platform.git
cd e-learning-platform
```

### 2. Arka Yüz Kurulumu
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Ortam değişkenleri
cp .env.example .env
# .env dosyasını düzenleyin

# Veritabanı geçişi
flask db upgrade

# Arka yüzü çalıştırın
python app.py
```

### 3. Ön Yüz Kurulumu
```bash
cd frontend
npm install

# Ortam değişkenleri
cp .env.local.example .env.local
# .env.local dosyasını düzenleyin

# Ön yüzü çalıştırın
npm run dev
```

### 4. Uygulamaya Erişim
- **Ön Yüz**: http://localhost:3000
- **Arka Yüz API**: http://localhost:5000

## 🔐 Ortam Değişkenleri

### Arka Yüz (.env)
```env
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
DATABASE_URL=postgresql://user:pass@localhost/dbname
FLASK_ENV=development
```

### Ön Yüz (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 📊 Veritabanı Şeması

### Ana Tablolar
- **Users** - Kullanıcı bilgileri (öğrenci/eğitmen)
- **Courses** - Kurs bilgileri
- **Lessons** - Ders içerikleri
- **Enrollments** - Kurs kayıtları
- **Assignments** - Ödev sistemi
- **Reviews** - Kurs değerlendirmeleri
- **Notifications** - Bildirim sistemi

## 🎯 API Uç Noktaları

### Kimlik Doğrulama
- `POST /auth/register` - Kullanıcı kaydı
- `POST /auth/login` - Kullanıcı girişi
- `POST /auth/refresh` - Token yenileme
- `GET /auth/me` - Kullanıcı bilgileri

### Kurslar
- `GET /courses` - Kurs listesi
- `POST /courses` - Kurs oluşturma
- `GET /courses/{id}` - Kurs detayları
- `PUT /courses/{id}` - Kurs güncelleme
- `DELETE /courses/{id}` - Kurs silme

### Kayıtlar
- `POST /enrollments` - Kursa kayıt
- `GET /enrollments/my-courses` - Kayıtlı kurslar

## 🚀 Dağıtım

Bu proje **Railway** platformunda canlıya alınmıştır.

### Railway Dağıtım Adımları
1. GitHub deposunu Railway'e bağlayın
2. Ortam değişkenlerini ayarlayın
3. PostgreSQL veritabanı ekleyin
4. Dağıtım butonuna tıklayın

## 🤝 Katkıda Bulunma

1. Çatallayın (Fork)
2. Özellik dalı oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi kaydedin (`git commit -m 'Add amazing feature'`)
4. Dalınıza gönderin (`git push origin feature/amazing-feature`)
5. Çekme İsteği (Pull Request) oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👤 Geliştirici

**Özgür Aktaş**
- LinkedIn: https://www.linkedin.com/in/ozgur-aktas/
- GitHub: [@ozguraktas5](https://github.com/ozguraktas5)
- E-posta: ozguraktas.55555@gmail.com

## 🙏 Teşekkürler

Bu projede kullanılan açık kaynak kütüphanelerin geliştiricilerine teşekkürler.

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın! 