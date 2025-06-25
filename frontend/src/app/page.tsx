'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Award, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Ana Bölüm */}
      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative py-24 sm:py-32 md:py-40">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900">
                <span className="block">Geleceğinizi</span>
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                  Şekillendirin
                </span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600 leading-relaxed">
                Uzman eğitmenler tarafından hazırlanan kurslarla kendinizi geliştirin,
                yeni beceriler edinin ve kariyerinizde ilerleyin.
              </p>
              <div className="mt-10">
                <Link
                  href="/register"
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                >
                  Ücretsiz Üye Ol
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Özellikler Bölümü */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Neden Bizi Seçmelisiniz?
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Size en iyi online eğitim deneyimini sunmak için çalışıyoruz.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 p-8 border border-gray-100">
              <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center mb-6">
                <BookOpen className="h-7 w-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Zengin İçerik
              </h3>
              <p className="text-gray-600">
                Farklı seviye ve kategorilerde yüzlerce kurs ile kendinizi geliştirebilirsiniz.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 p-8 border border-gray-100">
              <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Uzman Eğitmenler
              </h3>
              <p className="text-gray-600">
                Alanında uzman eğitmenlerden öğrenin ve deneyimlerinden faydalanın.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 p-8 border border-gray-100">
              <div className="w-14 h-14 rounded-xl bg-pink-100 flex items-center justify-center mb-6">
                <Award className="h-7 w-7 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Sertifikasyon
              </h3>
              <p className="text-gray-600">
                Tamamladığınız kurslar için sertifika alın ve başarılarınızı belgeleyin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* İstatistikler Bölümü */}
      <section className="py-24 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Rakamlarla Platformumuz
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">1000+</div>
              <div className="text-lg text-gray-600">Aktif Öğrenci</div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">100+</div>
              <div className="text-lg text-gray-600">Kurs</div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-xl bg-pink-100 flex items-center justify-center mb-4">
                <Award className="h-8 w-8 text-pink-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">50+</div>
              <div className="text-lg text-gray-600">Eğitmen</div>
            </div>
          </div>
        </div>
      </section>

      {/* Referanslar Bölümü */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Öğrencilerimiz Ne Diyor?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-600 mr-4">
                  A
                </div>
                <div>
                  <h4 className="text-lg font-semibold">Ahmet Yılmaz</h4>
                  <p className="text-gray-600">Web Geliştirme Öğrencisi</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                &ldquo;Bu platformdaki kurslar sayesinde 3 ay içinde junior web geliştirici olarak işe başladım. Eğitmenler gerçekten alanında uzman kişiler.&rdquo;
              </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-xl font-bold text-purple-600 mr-4">
                  M
                </div>
                <div>
                  <h4 className="text-lg font-semibold">Mehmet Kaya</h4>
                  <p className="text-gray-600">Veri Bilimi Öğrencisi</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                &ldquo;Veri bilimi alanında kendimi geliştirmek için mükemmel bir platform. Pratik örnekler ve gerçek projelerle öğrenme imkanı sunuyor.&rdquo;
              </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-xl font-bold text-pink-600 mr-4">
                  Z
                </div>
                <div>
                  <h4 className="text-lg font-semibold">Zeynep Demir</h4>
                  <p className="text-gray-600">UI/UX Tasarım Öğrencisi</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                &ldquo;Tasarım portfolyöme eklediğim projeler sayesinde freelance işler almaya başladım. Eğitmenlerin geri bildirimleri çok değerli.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bölümü */}
      <section className="py-20 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-6">
            <span className="block">Öğrenmeye Hazır mısınız?</span>
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              Hemen ücretsiz hesap oluşturun.
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Binlerce öğrenci ve onlarca eğitmenin bulunduğu platformumuza katılın, kariyerinizi bir adım öne taşıyın.
          </p>
          <Link
            href="/register"
            className="px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          >
            Ücretsiz Başla
          </Link>
        </div>
      </section>
    </div>
  );
} 