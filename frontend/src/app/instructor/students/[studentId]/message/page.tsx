'use client';

import { useState } from 'react'; //useState için
import { useParams, useRouter } from 'next/navigation'; //useParams ve useRouter için
import { useForm } from 'react-hook-form'; //useForm için
import { zodResolver } from '@hookform/resolvers/zod'; //zodResolver için
import { z } from 'zod'; //z için 
import { toast } from 'react-hot-toast'; //toast için
import Link from 'next/link'; //Link için

// Form validasyon şeması
const messageSchema = z.object({ 
  subject: z.string().min(3, 'Konu en az 3 karakter olmalıdır'), 
  message: z.string().min(10, 'Mesaj en az 10 karakter olmalıdır'),
});

type MessageFormData = z.infer<typeof messageSchema>; //MessageFormData için

export default function SendMessagePage() { //SendMessagePage için
  const router = useRouter(); //router için
  const { studentId } = useParams(); //studentId için
  const [submitting, setSubmitting] = useState(false); //submitting için

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema)
  });

  const onSubmit = async (data: MessageFormData) => { //onSubmit için
    try {
      setSubmitting(true); //submitting için
      // API entegrasyonu burada yapılacak
      toast.success('Mesaj başarıyla gönderildi!'); //toast.success için
      router.push('/instructor/students'); //router.push için
    } catch (error) { //error için
      console.error('Error sending message:', error); //console.error için
      toast.error('Mesaj gönderilirken bir hata oluştu'); //toast.error için
    } finally { //finally için
      setSubmitting(false); //setSubmitting için
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Öğrenciye Mesaj Gönder</h1>
          <Link
            href="/instructor/students"
            className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Öğrencilere Dön
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konu
              </label>
              <input
                {...register('subject')}
                type="text"
                placeholder="Mesaj konusu"
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.subject && (
                <p className="mt-2 text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mesaj
              </label>
              <textarea
                {...register('message')}
                rows={6}
                placeholder="Mesajınızı yazın"
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.message && (
                <p className="mt-2 text-sm text-red-600">{errors.message.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <Link
                href="/instructor/students"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {submitting ? 'Gönderiliyor...' : 'Mesaj Gönder'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 