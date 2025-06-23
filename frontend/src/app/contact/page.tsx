'use client'; 

import React, { useState } from 'react';  // React'ten React'i içe aktarır.
import { Mail, Phone, MapPin, Send } from 'lucide-react';  // Lucide React kütüphanesinden Mail, Phone, MapPin ve Send simgelerini içe aktarır.

export default function ContactPage() {  // ContactPage bileşenini dışa aktarır.
  const [formData, setFormData] = useState({  // formData değişkenini oluşturur ve başlangıç değerlerini atar.
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);  // isSubmitting değişkenini oluşturur ve başlangıç değerini atar.
  const [submitStatus, setSubmitStatus] = useState<{  // submitStatus değişkenini oluşturur ve başlangıç değerini atar.
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {  // handleChange fonksiyonunu oluşturur ve e değişkenini alır.
    const { name, value } = e.target;  // name ve value değişkenlerini oluşturur ve e.target'den alır.
    setFormData(prev => ({  // setFormData fonksiyonunu oluşturur ve prev değişkenini alır.
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {  // handleSubmit fonksiyonunu oluşturur ve e değişkenini alır.
    e.preventDefault();  // e.preventDefault() fonksiyonunu çağırır.
    setIsSubmitting(true);  // setIsSubmitting fonksiyonunu çağırır.
    setSubmitStatus({ type: null, message: '' });  // setSubmitStatus fonksiyonunu çağırır.

    try {  // try bloğunu oluşturur.
      // API entegrasyonu yapılacak
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simüle edilmiş API çağrısı
      setSubmitStatus({  // setSubmitStatus fonksiyonunu çağırır.
        type: 'success',
        message: 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.'
      });
      setFormData({ name: '', email: '', subject: '', message: '' });  // setFormData fonksiyonunu çağırır.
    } catch (error) {  // catch bloğunu oluşturur.
      setSubmitStatus({  // setSubmitStatus fonksiyonunu çağırır.
        type: 'error',
        message: 'Mesajınız gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
      });
    } finally {
      setIsSubmitting(false);  // setIsSubmitting fonksiyonunu çağırır.
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
      {/* İletişim */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">İletişim</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 leading-relaxed" style={{ lineHeight: '1.5' }}>
                Sizden Haber Almayı Bekliyoruz
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
              Sorularınız, önerileriniz veya işbirliği talepleriniz için bizimle iletişime geçebilirsiniz.
            </p>
          </div>
        </div>
      </section>

      {/* İletişim Bilgileri */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* İletişim Formu */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Bize Ulaşın</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Adınız Soyadınız
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Adınız Soyadınız"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    E-posta Adresiniz
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="ornek@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Konu
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Mesajınızın konusu"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Mesajınız
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Mesajınızı buraya yazın..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Gönder
                    </>
                  )}
                </button>

                {submitStatus.type && (
                  <div
                    className={`mt-4 p-4 rounded-lg ${
                      submitStatus.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}
                  >
                    {submitStatus.message}
                  </div>
                )}
              </form>
            </div>

            {/* İletişim Bilgileri */}
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">İletişim Bilgileri</h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <Mail className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">E-posta</h3>
                      <p className="mt-1 text-gray-600">iletisim@elearning.com</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <Phone className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Telefon</h3>
                      <p className="mt-1 text-gray-600">+90 212 123 45 67</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <MapPin className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Adres</h3>
                      <p className="mt-1 text-gray-600">
                        Levent Mahallesi, Büyükdere Caddesi No:123<br />
                        Şişli, İstanbul, Türkiye
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Harita */}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Konum</h2>
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3007.827461440436!2d29.006834776886707!3d41.07634047134592!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab63f6f8f8ea1%3A0xe9f3d2a4088f3831!2sLevent%2C%20B%C3%BCy%C3%BCkdere%20Cd.%2C%2034330%20Be%C5%9Fikta%C5%9F%2F%C4%B0stanbul!5e0!3m2!1str!2str!4v1708101234567!5m2!1str!2str"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 