'use client';

import { useState, useEffect } from 'react';  // React'ten useState ve useEffect'i içe aktarır.
import { useParams, useRouter } from 'next/navigation';  // Next.js'ten useParams ve useRouter'u içe aktarır.
import { assignmentsApi, AssignmentSubmission } from '@/lib/api/assignments';  // assignmentsApi ve AssignmentSubmission'u içe aktarır.
import { toast } from 'react-hot-toast';  // react-hot-toast'tan toast'u içe aktarır.

interface GradeFormData {  // GradeFormData interface'ini oluşturur.
  grade: number;  // grade değişkenini oluşturur ve number tipinde tanımlar.
  feedback: string;  // feedback değişkenini oluşturur ve string tipinde tanımlar.
}

export default function AssignmentSubmissionsPage() {  // AssignmentSubmissionsPage bileşenini dışa aktarır.
  const params = useParams();  // params değişkenini oluşturur ve useParams'ı kullanarak URL parametrelerini alır.
  const router = useRouter();  // router değişkenini oluşturur ve useRouter'ı kullanarak Next.js router'ını alır.
  const assignmentId = typeof params.id === 'string' ? parseInt(params.id, 10) : 0;  // assignmentId değişkenini oluşturur ve params.id'yi parseInt ile integer'a çevirir.
  
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);  // submissions değişkenini oluşturur ve AssignmentSubmission tipinde bir dizi ile başlatır.
  const [loading, setLoading] = useState(true);  // loading değişkenini oluşturur ve true ile başlatır.
  const [error, setError] = useState<string | null>(null);  // error değişkenini oluşturur ve string tipinde null ile başlatır.
  const [showGradeModal, setShowGradeModal] = useState(false);  // showGradeModal değişkenini oluşturur ve false ile başlatır.
  const [gradeForm, setGradeForm] = useState<GradeFormData>({ grade: 0, feedback: '' });  // gradeForm değişkenini oluşturur ve GradeFormData tipinde bir nesne ile başlatır.
  const [searchQuery, setSearchQuery] = useState('');  // searchQuery değişkenini oluşturur ve string tipinde '' ile başlatır.
  const [statusFilter, setStatusFilter] = useState('all');  // statusFilter değişkenini oluşturur ve 'all' ile başlatır.
  const [submitting, setSubmitting] = useState(false);  // submitting değişkenini oluşturur ve false ile başlatır.
  
  useEffect(() => {  // useEffect fonksiyonunu oluşturur ve assignmentId değişkenini kullanır.
    if (assignmentId === null) {  // assignmentId değişkeni null ise
      setError('Geçersiz ödev kimliği');  // setError fonksiyonunu çağırır ve 'Geçersiz ödev kimliği' ile başlatır.
      setLoading(false);  // setLoading fonksiyonunu çağırır ve false ile başlatır.
      return;  // return ile fonksiyonu sonlandırır.
    }
    
    async function fetchSubmissions() {  // fetchSubmissions fonksiyonunu oluşturur.
      try {  // try bloğunu oluşturur.
        setLoading(true);  // setLoading fonksiyonunu çağırır ve true ile başlatır.
        const data = await assignmentsApi.getAssignmentSubmissions(assignmentId);  // assignmentsApi'den getAssignmentSubmissions fonksiyonunu çağırır ve assignmentId'yi parametre olarak alır.
        setSubmissions(data);  // setSubmissions fonksiyonunu çağırır ve data'yı parametre olarak alır.
      } catch (err) {  // catch bloğunu oluşturur.
        console.error('Error fetching submissions:', err);  // console.error fonksiyonunu çağırır ve 'Error fetching submissions:' ile birlikte err'i yazdırır.
        setError('Ödev teslimleri yüklenirken bir hata oluştu.');  // setError fonksiyonunu çağırır ve 'Ödev teslimleri yüklenirken bir hata oluştu.' ile başlatır.
        toast.error('Ödev teslimleri yüklenirken bir hata oluştu.');  // toast.error fonksiyonunu çağırır ve 'Ödev teslimleri yüklenirken bir hata oluştu.' ile başlatır.
      } finally {  // finally bloğunu oluşturur.
        setLoading(false);  // setLoading fonksiyonunu çağırır ve false ile başlatır.
      }
    }
    
    fetchSubmissions();  // fetchSubmissions fonksiyonunu çağırır.
  }, [assignmentId]);
  
  // Teslimleri filtrele
  const filteredSubmissions = submissions.filter(submission => {
    // İsim veya email ile ara
    const matchesSearch =  // matchesSearch değişkenini oluşturur ve submission.student.name ve submission.student.email'i kullanarak arama yapar.
      submission.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||  // submission.student.name'in küçük harfe çevrilmiş hali searchQuery'in küçük harfe çevrilmiş hali içeriyorsa true döner.
      submission.student.email.toLowerCase().includes(searchQuery.toLowerCase());  // submission.student.email'in küçük harfe çevrilmiş hali searchQuery'in küçük harfe çevrilmiş hali içeriyorsa true döner.
    
    // Duruma göre filtrele
    let matchesStatus = true;  // matchesStatus değişkenini oluşturur ve true ile başlatır.
    if (statusFilter !== 'all') {  // statusFilter değişkeni 'all' değilse
      matchesStatus = submission.status === statusFilter;  // submission.status değişkeni statusFilter değişkenine eşitse true döner.
    }
    
    return matchesSearch && matchesStatus;
  });
  
  const openGradeModal = (submission: AssignmentSubmission) => {  // openGradeModal fonksiyonunu oluşturur ve submission değişkenini alır.
    setSelectedSubmission(submission);  // setSelectedSubmission fonksiyonunu çağırır ve submission'ı parametre olarak alır.
    setGradeForm({  // setGradeForm fonksiyonunu çağırır ve gradeForm değişkenini parametre olarak alır.
      grade: submission.grade || 0,  // submission.grade değişkeni 0 ise 0 döner.
      feedback: submission.feedback || ''  // submission.feedback değişkeni '' ise '' döner.
    });
    setShowGradeModal(true);  // setShowGradeModal fonksiyonunu çağırır ve true ile başlatır.
  };
  
  const closeGradeModal = () => {  // closeGradeModal fonksiyonunu oluşturur.
    setShowGradeModal(false);  // setShowGradeModal fonksiyonunu çağırır ve false ile başlatır.
    setSelectedSubmission(null);  // setSelectedSubmission fonksiyonunu çağırır ve null ile başlatır.
  };
  
  const handleGradeSubmit = async (e: React.FormEvent) => {  // handleGradeSubmit fonksiyonunu oluşturur ve e değişkenini alır.
    e.preventDefault();  // e.preventDefault() fonksiyonunu çağırır.
    
    if (!selectedSubmission) return;  // selectedSubmission değişkeni null ise return ile fonksiyonu sonlandırır.
    
    try {
      setSubmitting(true);  // setSubmitting fonksiyonunu çağırır ve true ile başlatır.
      
      const result = await assignmentsApi.gradeSubmission(  // assignmentsApi'den gradeSubmission fonksiyonunu çağırır ve selectedSubmission.id'yi ve gradeForm.grade ve gradeForm.feedback'i parametre olarak alır.
        selectedSubmission.id,
        gradeForm.grade,
        gradeForm.feedback
      );
      
      if (result.success) {  // result.success değişkeni true ise
        // Başarılı olursa state'i güncelle
        setSubmissions(prevSubmissions =>  // setSubmissions fonksiyonunu çağırır ve prevSubmissions değişkenini parametre olarak alır.
          prevSubmissions.map(sub => 
            sub.id === selectedSubmission.id  // sub.id değişkeni selectedSubmission.id değişkenine eşitse
              ? {  // {
                  ...sub,  // ...sub,
                  grade: gradeForm.grade,  // gradeForm.grade değişkeni grade değişkenine eşitlenir.
                  feedback: gradeForm.feedback,  // gradeForm.feedback değişkeni feedback değişkenine eşitlenir.
                  status: 'graded',  // status değişkeni 'graded' değişkenine eşitlenir.
                  graded_at: new Date().toISOString()  // new Date().toISOString() değişkeni graded_at değişkenine eşitlenir.
                }
              : sub  // sub değişkeni döner.
          )
        );
        
        toast.success('Değerlendirme başarıyla kaydedildi.');  // toast.success fonksiyonunu çağırır ve 'Değerlendirme başarıyla kaydedildi.' ile başlatır.
        closeGradeModal();  // closeGradeModal fonksiyonunu çağırır.
      }
    } catch (err) {  // catch bloğunu oluşturur.
      console.error('Error grading submission:', err);  // console.error fonksiyonunu çağırır ve 'Error grading submission:' ile birlikte err'i yazdırır.
      toast.error('Değerlendirme kaydedilirken bir hata oluştu.');  // toast.error fonksiyonunu çağırır ve 'Değerlendirme kaydedilirken bir hata oluştu.' ile başlatır.
    } finally {  // finally bloğunu oluşturur.
      setSubmitting(false);  // setSubmitting fonksiyonunu çağırır ve false ile başlatır.
    }
  };
  
  // Tarihi formatlama
  const formatDate = (dateString: string) => {  // formatDate fonksiyonunu oluşturur ve dateString değişkenini alır.
    const date = new Date(dateString);  // date değişkenini oluşturur ve dateString'i new Date ile tarihleştirir.
    return date.toLocaleDateString('tr-TR', {  // date.toLocaleDateString fonksiyonunu çağırır ve 'tr-TR' ile tarih formatını ayarlar.
      day: 'numeric',  // day: 'numeric', 
      month: 'long',  // month: 'long', 
      year: 'numeric',  // year: 'numeric', 
      hour: '2-digit',  // hour: '2-digit', 
      minute: '2-digit'  // minute: '2-digit'
    });  // date.toLocaleDateString fonksiyonunun dönüş değeri döner.
  };
  
  // Zaman farkını formatlama (... önce şeklinde)
  const formatTimeAgo = (dateString: string) => {  // formatTimeAgo fonksiyonunu oluşturur ve dateString değişkenini alır.
    const date = new Date(dateString);  // date değişkenini oluşturur ve dateString'i new Date ile tarihleştirir.
    const now = new Date();  // now değişkenini oluşturur ve new Date ile tarihleştirir.
    const diffTime = Math.abs(now.getTime() - date.getTime());  // diffTime değişkenini oluşturur ve now.getTime() - date.getTime() ile zaman farkını hesaplar.
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));  // diffDays değişkenini oluşturur ve diffTime'ı 1000 * 60 * 60 * 24'e böler.
    
    if (diffDays === 0) {  // diffDays değişkeni 0 ise
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));  // diffHours değişkenini oluşturur ve diffTime'ı 1000 * 60 * 60'a böler.
      if (diffHours === 0) {  // diffHours değişkeni 0 ise
        const diffMinutes = Math.floor(diffTime / (1000 * 60));  // diffMinutes değişkenini oluşturur ve diffTime'ı 1000 * 60'a böler.
        return `${diffMinutes} dakika önce`;  // diffMinutes değişkeni döner.
      }
      return `${diffHours} saat önce`;  // diffHours değişkeni döner.
    } else if (diffDays === 1) {
      return 'Dün';  // 'Dün' döner.
    } else if (diffDays < 7) {  // diffDays değişkeni 7'den küçükse
      return `${diffDays} gün önce`;  // diffDays değişkeni döner.
    } else if (diffDays < 30) {  // diffDays değişkeni 30'dan küçükse
      const weeks = Math.floor(diffDays / 7);  // weeks değişkenini oluşturur ve diffDays'ı 7'ye böler.
      return `${weeks} hafta önce`;  // weeks değişkeni döner.
    } else if (diffDays < 365) {  // diffDays değişkeni 365'den küçükse
      const months = Math.floor(diffDays / 30);  // months değişkenini oluşturur ve diffDays'ı 30'a böler.
      return `${months} ay önce`;  // months değişkeni döner.
    } else {  // else bloğunu oluşturur.
      const years = Math.floor(diffDays / 365);  // years değişkenini oluşturur ve diffDays'ı 365'e böler.
      return `${years} yıl önce`;  // years değişkeni döner.
    }
  };
  
  if (loading) {  // loading değişkeni true ise
    return (
      <div className="container mx-auto p-6 flex justify-center">  // container mx-auto p-6 flex justify-center değişkenini oluşturur.
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>  // animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 değişkenini oluşturur.
      </div>
    );  // return ile fonksiyonu sonlandırır.
  }
  
  if (error) {  // error değ
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          <h3 className="font-medium text-xl">Hata</h3>
          <p className="mt-2">{error}</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:underline"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Ödevlere Geri Dön
        </button>
      </div>
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Ödev Teslimleri</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-2 text-blue-700">
          <span className="font-medium">{filteredSubmissions.length}</span> teslim, 
          <span className="font-medium ml-1">
            {filteredSubmissions.filter(sub => sub.status === 'graded').length}
          </span> notlandırıldı
        </div>
      </div>
      
      {/* Filtreleme Alanı */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">Öğrenci Ara</label>
            <input
              type="text"
              id="search"
              placeholder="İsim veya e-posta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Teslimler</option>
              <option value="submitted">Teslim Edildi</option>
              <option value="graded">Notlandırıldı</option>
              <option value="late">Geç Teslim</option>
              <option value="resubmitted">Yeniden Teslim</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Teslimler Listesi */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-10 text-center">
          <h3 className="text-xl font-medium text-gray-700">Teslim Bulunamadı</h3>
          <p className="mt-2 text-gray-500">
            {searchQuery || statusFilter !== 'all' 
              ? 'Arama kriterlerinize uygun teslim bulunamadı. Filtreleri değiştirmeyi deneyin.'
              : 'Bu ödev için henüz teslim yapılmamış.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredSubmissions.map(submission => (
            <div key={submission.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-12 w-12 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
                      {submission.student.avatar ? (
                        <img 
                          src={submission.student.avatar} 
                          alt={submission.student.name} 
                          className="h-full w-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center', 'bg-blue-100', 'text-blue-500');
                            e.currentTarget.parentElement!.innerHTML = `<span>${submission.student.name.charAt(0)}</span>`;
                          }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500">
                          <span>{submission.student.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium">{submission.student.name}</h3>
                      <p className="text-sm text-gray-500">{submission.student.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center">
                      {submission.status === 'graded' && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                          Notlandırıldı
                        </span>
                      )}
                      {submission.status === 'submitted' && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                          Teslim Edildi
                        </span>
                      )}
                      {submission.status === 'late' && (
                        <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                          Geç Teslim
                        </span>
                      )}
                      {submission.status === 'resubmitted' && (
                        <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                          Yeniden Teslim
                        </span>
                      )}
                      <span className="text-gray-500 text-sm">{formatTimeAgo(submission.submitted_at)}</span>
                    </div>
                    <span className="text-xs text-gray-400 mt-1">
                      {formatDate(submission.submitted_at)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="prose max-w-none">
                  <p>{submission.content}</p>
                </div>
                
                {submission.attachments && submission.attachments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Ekler:</h4>
                    <div className="flex flex-wrap gap-2">
                      {submission.attachments.map(attachment => (
                        <a 
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
                        >
                          {/* Dosya tipine göre ikon */}
                          {attachment.type.includes('pdf') && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          )}
                          {attachment.type.includes('word') && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          )}
                          {attachment.type.includes('zip') && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          )}
                          {attachment.type.includes('image') && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                          {!(attachment.type.includes('pdf') || attachment.type.includes('word') || attachment.type.includes('zip') || attachment.type.includes('image')) && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                          <span>{attachment.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                {submission.grade !== undefined && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Değerlendirme</h4>
                      {submission.graded_at && (
                        <span className="text-xs text-gray-500">
                          {formatDate(submission.graded_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center mb-3">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                        <div 
                          className={`h-2.5 rounded-full ${
                            submission.grade >= 80 ? 'bg-green-600' : 
                            submission.grade >= 60 ? 'bg-blue-600' :
                            submission.grade >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${submission.grade}%` }}
                        ></div>
                      </div>
                      <span className="text-lg font-bold">{submission.grade}%</span>
                    </div>
                    {submission.feedback && (
                      <div className="text-gray-700">
                        <p>{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => openGradeModal(submission)}
                    className={`${
                      submission.status === 'graded' 
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-700' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } px-4 py-2 rounded-md transition-colors`}
                  >
                    {submission.status === 'graded' ? 'Değerlendirmeyi Düzenle' : 'Notlandır'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Notlandırma Modalı */}
      {showGradeModal && selectedSubmission && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeGradeModal}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Ödevi Notlandır</h2>
              <button 
                onClick={closeGradeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 flex-shrink-0 rounded-full overflow-hidden bg-gray-100 mr-2">
                  {selectedSubmission.student.avatar ? (
                    <img 
                      src={selectedSubmission.student.avatar} 
                      alt={selectedSubmission.student.name} 
                      className="h-full w-full object-cover" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center', 'bg-blue-100', 'text-blue-500');
                        e.currentTarget.parentElement!.innerHTML = `<span>${selectedSubmission.student.name.charAt(0)}</span>`;
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500">
                      <span>{selectedSubmission.student.name.charAt(0)}</span>
                    </div>
                  )}
                  <span className="font-medium">{selectedSubmission.student.name}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Teslim Tarihi: {formatDate(selectedSubmission.submitted_at)}
              </p>
            </div>
            
            <form onSubmit={handleGradeSubmit}>
              <div className="mb-4">
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                  Not (0-100)
                </label>
                <input
                  type="number"
                  id="grade"
                  min="0"
                  max="100"
                  value={gradeForm.grade}
                  onChange={(e) => setGradeForm({...gradeForm, grade: parseInt(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                  Geri Bildirim
                </label>
                <textarea
                  id="feedback"
                  rows={4}
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm({...gradeForm, feedback: e.target.value})}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Öğrenciye geri bildiriminizi yazın..."
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeGradeModal}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
                  disabled={submitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Kaydediliyor...
                    </span>
                  ) : (
                    'Değerlendirmeyi Kaydet'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 