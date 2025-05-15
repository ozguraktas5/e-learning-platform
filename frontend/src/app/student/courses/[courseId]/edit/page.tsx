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
    <div className="border-b border-gray-200 p-2 space-x-2">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
      >Kalın</button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
      >İtalik</button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`px-2 py-1 rounded ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
      >Altı Çizili</button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
      >Madde Listesi</button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
      >Numaralı Liste</button>
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
        setPreviewUrl(data.image_url || null);
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
      setPreviewUrl(URL.createObjectURL(file));
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
      router.push(`/courses/${courseId}`);
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
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Kursu Düzenle</h1>
        <button
          type="button"
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {isPreviewMode ? 'Düzenlemeye Dön' : 'Önizleme'}
        </button>
      </div>

      {isPreviewMode ? (
        <div className="max-w-2xl">
          {previewUrl && (
            <div className="relative w-full h-48 mb-6">
              <Image src={previewUrl} alt="Preview" fill className="object-cover rounded-lg" />
            </div>
          )}
          <h2 className="text-2xl font-bold mb-4">{watchedFields.title}</h2>
          <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: watchedFields.description || '' }} />
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-medium text-gray-700">Kategori</h3>
              <p>{watchedFields.category}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Seviye</h3>
              <p>{watchedFields.level}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Fiyat</h3>
              <p>{watchedFields.price} TL</p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">Kurs Görseli</label>
            <div
              {...getRootProps()}
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <div className="space-y-2 text-center">
                {previewUrl ? (
                  <div className="relative w-full h-48 mb-4">
                    <Image src={previewUrl} alt="Preview" fill className="object-contain" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); setValue('image', undefined); }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 m-2"
                    >×</button>
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
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Başlık</label>
            <input
              id="title"
              {...register('title')}
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
            <MenuBar editor={editor} />
            <Controller
              name="description"
              control={control}
              render={() => <EditorContent editor={editor} />}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Kategori</label>
              <select
                id="category"
                {...register('category')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seçin</option>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
            </div>
            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700">Seviye</label>
              <select
                id="level"
                {...register('level')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seçin</option>
                {levels.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
              {errors.level && <p className="mt-1 text-sm text-red-600">{errors.level.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Fiyat (TL)</label>
            <input
              id="price"
              type="number"
              {...register('price', { valueAsNumber: true })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
          </div>

          <div>
            <button
              type="submit"
              disabled={!isDirty || isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}