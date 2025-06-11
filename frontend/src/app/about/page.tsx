'use client';

import React from 'react';
import { BookOpen, Users, Award, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Hakkımızda</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 leading-relaxed" style={{ lineHeight: '1.5' }}>
                Eğitimin Geleceğini Şekillendiriyoruz
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
              Kaliteli eğitimi herkes için erişilebilir kılma misyonuyla yola çıktık.
              Her gün binlerce öğrenciye ve eğitmene ev sahipliği yapıyoruz.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Misyonumuz</h2>
              <p className="text-gray-600 leading-relaxed">
                Kaliteli eğitimi demokratikleştirmek ve herkes için erişilebilir kılmak.
                Öğrencilerimizin potansiyellerini keşfetmelerine ve kariyerlerinde ilerlemelerine
                yardımcı olmak için sürekli çalışıyoruz.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Vizyonumuz</h2>
              <p className="text-gray-600 leading-relaxed">
                Dünyanın en kapsamlı ve etkili online eğitim platformu olmak.
                Teknoloji ve eğitimi harmanlayarak, öğrenme deneyimini sürekli
                geliştirmek ve yenilikçi çözümler sunmak.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">50K+</div>
              <div className="text-gray-600 mt-1">Aktif Öğrenci</div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">200+</div>
              <div className="text-gray-600 mt-1">Kurs</div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-pink-100 flex items-center justify-center">
                <Award className="h-6 w-6 text-pink-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">10K+</div>
              <div className="text-gray-600 mt-1">Sertifika</div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
                <Heart className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">98%</div>
              <div className="text-gray-600 mt-1">Memnuniyet</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Ekibimiz</h2>
            <p className="mt-4 text-xl text-gray-600">
              Eğitimin geleceğini şekillendiren tutkulu ekibimizle tanışın
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                AY
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Ahmet Yılmaz</h3>
              <p className="text-gray-600 mt-1">Kurucu & CEO</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                MD
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Mehmet Demir</h3>
              <p className="text-gray-600 mt-1">Eğitim Direktörü</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                ZK
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Zeynep Kaya</h3>
              <p className="text-gray-600 mt-1">Teknoloji Direktörü</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 