'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { coursesApi } from '@/lib/api/courses';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import Image from 'next/image';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const DRAFT_KEY = 'course_draft';
const AUTO_SAVE_DELAY = 2000; // 2 seconds

const courseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  level: z.string().min(1, 'Level is required'),
  price: z.number().min(0, 'Price must be 0 or greater'),
  image: z
    .custom<FileList>()
    .optional()
    .refine((files) => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE, 'Maksimum dosya boyutu 5MB olmalıdır.')
    .refine(
      (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0].type),
      'Sadece .jpg, .jpeg, .png ve .webp formatları desteklenmektedir.'
    ),
});

type CourseFormData = z.infer<typeof courseSchema>;

const categories = [
  'Programlama',
  'Tasarım',
  'İşletme',
  'Pazarlama',
  'Kişisel Gelişim',
  'Müzik',
  'Fotoğrafçılık',
  'Diğer'
];

const levels = [
  'Başlangıç',
  'Orta',
  'İleri'
];

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 p-2 space-x-2">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
        type="button"
      >
        Kalın
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
        type="button"
      >
        İtalik
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`px-2 py-1 rounded ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
        type="button"
      >
        Altı Çizili
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
        type="button"
      >
        Başlık
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
        type="button"
      >
        Liste
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
        type="button"
      >
        Numaralı Liste
      </button>
    </div>
  );
};

export default function CreateCoursePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Link,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setValue('description', editor.getHTML());
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    control,
    watch,
    reset,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      price: 0,
      description: ''
    }
  });

  const watchedFields = watch();

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        reset(draftData);
        setIsDraft(true);
        if (draftData.image) {
          setPreviewUrl(draftData.image);
        }
        if (draftData.description && editor) {
          editor.commands.setContent(draftData.description);
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, [reset, editor]);

  // Auto-save draft
  useEffect(() => {
    if (!isDirty) return;

    const timeoutId = setTimeout(() => {
      const draftData = {
        ...watchedFields,
        image: previewUrl
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      setIsDraft(true);
    }, AUTO_SAVE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [watchedFields, isDirty, previewUrl]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setIsDraft(false);
    reset({
      price: 0,
      description: ''
    });
    setPreviewUrl(null);
    if (editor) {
      editor.commands.setContent('');
    }
  }, [reset, editor]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setValue('image', [file] as unknown as FileList);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }, [setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ACCEPTED_IMAGE_TYPES
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false
  });

  const onSubmit = async (data: CourseFormData) => {
    if (!user?.id) {
      toast.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
      router.push('/auth/login');
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
      setIsLoading(true);
      await coursesApi.createCourse(formData);
      toast.success('Kurs başarıyla oluşturuldu!');
      clearDraft();
      router.push('/instructor/courses');
      window.location.reload();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
        router.push('/auth/login');
        return;
      }
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Kurs oluşturulurken bir hata oluştu';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Yeni Kurs Oluştur</h1>
        <div className="space-x-4">
          {isDraft && (
            <button
              type="button"
              onClick={clearDraft}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
            >
              Taslağı Sil
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {isPreviewMode ? 'Düzenlemeye Dön' : 'Önizleme'}
          </button>
        </div>
      </div>

      {isDraft && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-600">
            Kaydedilmemiş bir taslağınız var. Formu doldururken otomatik olarak kaydedilecektir.
          </p>
        </div>
      )}

      {isPreviewMode ? (
        <div className="max-w-2xl">
          {previewUrl && (
            <div className="relative w-full h-48 mb-6">
              <Image
                src={previewUrl}
                alt="Course preview"
                fill
                className="object-cover rounded-lg"
              />
            </div>
          )}
          <h2 className="text-2xl font-bold mb-4">{watchedFields.title || 'Kurs Başlığı'}</h2>
          <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: watchedFields.description || '' }} />
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-medium text-gray-700">Kategori</h3>
              <p>{watchedFields.category || 'Belirtilmedi'}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Seviye</h3>
              <p>{watchedFields.level || 'Belirtilmedi'}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Fiyat</h3>
              <p>{watchedFields.price ? `${watchedFields.price} TL` : 'Ücretsiz'}</p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
              Kurs Görseli
            </label>
            <div
              {...getRootProps()}
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <div className="space-y-2 text-center">
                {previewUrl ? (
                  <div className="relative w-full h-48 mb-4">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-contain"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewUrl(null);
                        setValue('image', undefined);
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 m-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
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
            {errors.image && (
              <p className="mt-1 text-sm text-red-600">{errors.image.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Kurs Başlığı
            </label>
            <input
              {...register('title')}
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Kurs Açıklaması
            </label>
            <div className="mt-1 border border-gray-300 rounded-md">
              <MenuBar editor={editor} />
              <div className="p-4">
                <EditorContent editor={editor} />
              </div>
            </div>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Kategori
            </label>
            <select
              {...register('category')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Kategori Seçin</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700">
              Seviye
            </label>
            <select
              {...register('level')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seviye Seçin</option>
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            {errors.level && (
              <p className="mt-1 text-sm text-red-600">{errors.level.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Fiyat (Opsiyonel)
            </label>
            <input
              {...register('price', { valueAsNumber: true })}
              type="number"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Oluşturuluyor...' : 'Kurs Oluştur'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}