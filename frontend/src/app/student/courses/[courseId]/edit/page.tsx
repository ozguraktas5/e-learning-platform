'use client';

import { useState, useEffect, useCallback } from 'react'; //useState, useEffect, useCallback için
import { useRouter, useParams } from 'next/navigation'; //useRouter, useParams için
import { useForm, Controller } from 'react-hook-form'; //useForm, Controller için
import { zodResolver } from '@hookform/resolvers/zod'; //zodResolver için
import { z } from 'zod'; //z için
import { toast } from 'react-toastify'; //toast için
import { coursesApi } from '@/lib/api/courses'; //coursesApi için
import { useAuth } from '@/contexts/AuthContext'; //useAuth için
import axios from 'axios'; //axios için
import Image from 'next/image'; //Image için
import { useDropzone } from 'react-dropzone'; //useDropzone için
import { useEditor, EditorContent } from '@tiptap/react'; //useEditor, EditorContent için
import StarterKit from '@tiptap/starter-kit'; //StarterKit için
import Underline from '@tiptap/extension-underline'; //Underline için
import TextStyle from '@tiptap/extension-text-style'; //TextStyle için
import Color from '@tiptap/extension-color'; //Color için
import LinkExtension from '@tiptap/extension-link'; //LinkExtension için
import type { Editor } from '@tiptap/react'; //Editor için

// Görsel yükleme için sabitler
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB için
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']; //ACCEPTED_IMAGE_TYPES için

// Form şeması
const courseSchema = z.object({ //courseSchema için
  title: z.string().min(1, 'Kurs başlığı gerekli'), //title için
  description: z.string().min(1, 'Açıklama gerekli'), //description için
  category: z.string().min(1, 'Kategori gerekli'), //category için
  level: z.string().min(1, 'Seviye gerekli'), //level için
  price: z.number().min(0, 'Fiyat 0 veya daha büyük olmalı'), //price için
  image: z.custom<FileList>().optional(), //image için
});

type CourseFormData = z.infer<typeof courseSchema>; //CourseFormData için

const categories = [ //categories için
  'Programlama', 'Tasarım', 'İşletme', 'Pazarlama', 'Kişisel Gelişim', 'Müzik', 'Fotoğrafçılık', 'Diğer' //categories için
];
const levels = ['Başlangıç', 'Orta', 'İleri']; //levels için

const MenuBar = ({ editor }: { editor: Editor | null }) => { //MenuBar için
  if (!editor) return null; //editor için
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

export default function EditCoursePage() { //EditCoursePage için
  const router = useRouter(); //router için
  const { courseId } = useParams(); //courseId için
  const { user, loading } = useAuth(); //user, loading için
  const [loadingData, setLoadingData] = useState(true); //loadingData için
  const [isSubmitting, setIsSubmitting] = useState(false); //isSubmitting için
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); //previewUrl için
  const [isPreviewMode, setIsPreviewMode] = useState(false); //isPreviewMode için

  const editor = useEditor({ //editor için
    extensions: [StarterKit, Underline, TextStyle, Color, LinkExtension], //extensions için
    content: '', //content için
    onUpdate: ({ editor }) => { //onUpdate için
      setValue('description', editor.getHTML()); //setValue için
    },
  });

  const { register, handleSubmit, setValue, control, watch, reset, formState: { errors, isDirty } } = useForm<CourseFormData>({ //register, handleSubmit, setValue, control, watch, reset, formState: { errors, isDirty } için
    resolver: zodResolver(courseSchema), //resolver için
    defaultValues: { title: '', description: '', category: '', level: '', price: 0 }, //defaultValues için
  });
  const watchedFields = watch(); //watchedFields için

  // Mevcut kurs verilerini al
  useEffect(() => { //useEffect için
    if (loading) return; //loading için
    if (!user) { //user için
      router.push('/login'); //router.push için
      return; //return için
    }
    const fetchCourse = async () => { //fetchCourse için
      try {
        const data = await coursesApi.getCourse(Number(courseId)); //data için
        reset({ //reset için
          title: data.title, //title için
          description: data.description, //description için
          category: data.category, //category için
          level: data.level, //level için
          price: data.price, //price için
        });
        setPreviewUrl(data.image_url || null); //setPreviewUrl için
        editor?.commands.setContent(data.description); //editor?.commands.setContent için
      } catch { //catch için
        toast.error('Kurs yüklenirken hata oluştu'); //toast.error için
        router.push('/courses'); //router.push için
      } finally { //finally için
        setLoadingData(false); //setLoadingData için
      }
    };
    fetchCourse(); //fetchCourse için
  }, [loading, user, courseId, reset, router, editor]); //loading, user, courseId, reset, router, editor için

  // Görsel yükleme
  const onDrop = useCallback((acceptedFiles: File[]) => { //onDrop için
    if (acceptedFiles.length > 0) { //acceptedFiles.length > 0 için
      const file = acceptedFiles[0]; //file için
      setValue('image', [file] as unknown as FileList); //setValue için
      setPreviewUrl(URL.createObjectURL(file)); //setPreviewUrl için
    }
  }, [setValue]); //setValue için

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ //getRootProps, getInputProps, isDragActive için
    onDrop, //onDrop için
    accept: { 'image/*': ACCEPTED_IMAGE_TYPES }, //accept için
    maxSize: MAX_FILE_SIZE, //maxSize için
    multiple: false, //multiple için
  });

  const onSubmit = async (data: CourseFormData) => { //onSubmit için
    if (!user?.id) {
      toast.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
      router.push('/login');
      return;
    }
    const formData = new FormData(); //formData için
    formData.append('title', data.title); //title için
    formData.append('description', data.description); //description için
    formData.append('category', data.category); //category için
    formData.append('level', data.level); //level için
    formData.append('price', data.price.toString()); //price için
    formData.append('instructor_id', user.id.toString()); //instructor_id için
    if (data.image?.[0]) { //data.image?.[0] için
      formData.append('image', data.image[0]); //image için
    }

    try {
      setIsSubmitting(true); //setIsSubmitting için
      await coursesApi.updateCourse(courseId?.toString() || '', formData); //coursesApi.updateCourse için
      toast.success('Kurs başarıyla güncellendi!'); //toast.success için
      router.push(`/courses/${courseId}`); //router.push için
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) { //axios.isAxiosError(error) && error.response?.status === 401 için
        toast.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.'); //toast.error için
        router.push('/login'); //router.push için
        return; //return için
      }
      toast.error(error instanceof Error ? error.message : 'Güncelleme sırasında hata oluştu'); //toast.error için
    } finally { //finally için
      setIsSubmitting(false); //setIsSubmitting için
    }
  };

  if (loadingData) { //loadingData için
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
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