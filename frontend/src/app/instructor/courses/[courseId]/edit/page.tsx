'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { coursesApi } from '@/lib/api/courses';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import LinkExtension from '@tiptap/extension-link';
import type { Editor } from '@tiptap/react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { API_URL } from '@/config';

// Constants for image upload
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Form schema
const courseSchema = z.object({
  title: z.string().min(1, 'Kurs başlığı gerekli'),
  description: z.string().min(1, 'Açıklama gerekli'),
  category: z.string().min(1, 'Kategori gerekli'),
  level: z.string().min(1, 'Seviye gerekli'),
  price: z.number().min(0, 'Fiyat 0 veya daha büyük olmalı'),
  image: z.custom<FileList>().optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

const categories = [
  'Programlama', 'Tasarım', 'İşletme', 'Pazarlama', 'Kişisel Gelişim', 'Müzik', 'Fotoğrafçılık', 'Diğer'
];
const levels = ['Başlangıç', 'Orta', 'İleri'];

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;
  return (
    <div className="border-b border-gray-200 p-4 space-x-2 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          editor.isActive('bold') 
            ? 'bg-blue-100 text-blue-700' 
            : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Kalın
        </div>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          editor.isActive('italic')
            ? 'bg-blue-100 text-blue-700'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          İtalik
        </div>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          editor.isActive('underline')
            ? 'bg-blue-100 text-blue-700'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          Altı Çizili
        </div>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          editor.isActive('bulletList')
            ? 'bg-blue-100 text-blue-700'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          Madde Listesi
        </div>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          editor.isActive('orderedList')
            ? 'bg-blue-100 text-blue-700'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
          </svg>
          Numaralı Liste
        </div>
      </button>
    </div>
  );
};

export default function EditCoursePage() {
  const router = useRouter();
  const { courseId } = useParams();
  const { user, loading } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Underline, TextStyle, Color, LinkExtension],
    content: '',
    onUpdate: ({ editor }) => {
      setValue('description', editor.getHTML());
    },
  });

  const { register, handleSubmit, setValue, control, watch, reset, formState: { errors, isDirty } } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: { title: '', description: '', category: '', level: '', price: 0 },
  });
  const watchedFields = watch();

  // Fetch existing course data
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    const fetchCourse = async () => {
      try {
        const data = await coursesApi.getCourse(Number(courseId));
        reset({
          title: data.title,
          description: data.description,
          category: data.category,
          level: data.level,
          price: data.price,
        });
        if (data.image_url) {
          setPreviewUrl(`${API_URL}${data.image_url}`);
        }
        editor?.commands.setContent(data.description);
      } catch {
        toast.error('Kurs yüklenirken hata oluştu');
        router.push('/courses');
      } finally {
        setLoadingData(false);
      }
    };
    fetchCourse();
  }, [loading, user, courseId, reset, router, editor]);

  // Image drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setValue('image', [file] as unknown as FileList);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  }, [setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ACCEPTED_IMAGE_TYPES },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  const onSubmit = async (data: CourseFormData) => {
    if (!user?.id) {
      toast.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
      router.push('/login');
      return;
    }
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('level', data.level);
    formData.append('price', data.price.toString());
    formData.append('instructor_id', user.id.toString());
    if (data.image?.[0]) {
      formData.append('image', data.image[0]);
    }

    try {
      setIsSubmitting(true);
      await coursesApi.updateCourse(courseId?.toString() || '', formData);
      toast.success('Kurs başarıyla güncellendi!');
      router.push(`/instructor/courses/${courseId}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
        router.push('/login');
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Güncelleme sırasında hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingData) {
    return <LoadingSpinner size="medium" fullScreen />;
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Kursu Düzenle</h1>
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{isPreviewMode ? 'Düzenlemeye Dön' : 'Önizleme'}</span>
          </button>
        </div>

        {isPreviewMode ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            {previewUrl && (
              <div className="relative w-full h-64 mb-6">
                <Image src={previewUrl} alt="Preview" fill className="object-cover rounded-lg" />
              </div>
            )}
            <h2 className="text-2xl font-bold mb-4">{watchedFields.title}</h2>
            <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: watchedFields.description || '' }} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Kategori</h3>
                <p className="text-gray-900">{watchedFields.category}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Seviye</h3>
                <p className="text-gray-900">{watchedFields.level}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Fiyat</h3>
                <p className="text-gray-900">{watchedFields.price} TL</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">Kurs Görseli</label>
                <div
                  {...getRootProps()}
                  className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg ${
                    isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <div className="space-y-2 text-center">
                    {previewUrl ? (
                      <div className="relative w-full h-64 mb-4">
                        <Image src={previewUrl} alt="Preview" fill className="object-contain" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); setValue('image', undefined); }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <input {...register('image')} {...getInputProps()} />
                          <p className="pl-1">Sürükleyip bırakın veya tıklayarak seçin</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, WEBP (max 5MB)</p>
                      </>
                    )}
                  </div>
                </div>
                {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image.message}</p>}
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Başlık</label>
                <input
                  id="title"
                  {...register('title')}
                  type="text"
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Kurs başlığını girin"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                <div className="border rounded-lg overflow-hidden">
                  <MenuBar editor={editor} />
                  <div className="p-4 min-h-[200px] bg-white">
                    <Controller
                      name="description"
                      control={control}
                      render={() => <EditorContent editor={editor} />}
                    />
                  </div>
                </div>
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                  <select
                    id="category"
                    {...register('category')}
                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seçin</option>
                    {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
                </div>
                <div>
                  <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">Seviye</label>
                  <select
                    id="level"
                    {...register('level')}
                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seçin</option>
                    {levels.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
                  </select>
                  {errors.level && <p className="mt-1 text-sm text-red-600">{errors.level.message}</p>}
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">Fiyat (TL)</label>
                  <input
                    id="price"
                    type="number"
                    {...register('price', { valueAsNumber: true })}
                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                  {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={!isDirty || isSubmitting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Güncelleniyor...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span>Güncelle</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}