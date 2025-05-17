import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  // Hata ayıklama için
  validateStatus: function (status) {
    return status >= 200 && status < 500; // 500 ve üzeri hataları reject et
  },
});

// Token yenileme için kullanılacak değişkenler
let isRefreshing = false;

interface QueueItem {
  resolve: (value: string | PromiseLike<string>) => void;
  reject: (reason?: unknown) => void;
}

let failedQueue: QueueItem[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  
  failedQueue = [];
};

// Backend URL'sini oluşturan yardımcı fonksiyon
export const getBackendUrl = (path: string): string => {
  // Eğer yol zaten tam bir URL ise, olduğu gibi döndür
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // path'in başında / olduğundan emin ol
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Backend URL'siyle birleştir
  return `http://localhost:5000${normalizedPath}`;
};

// İmage URL'lerini almak için özel bir yardımcı fonksiyon
export const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    return 'https://via.placeholder.com/300x200?text=Resim+Yok';
  }
  
  // Backend'den gelen resim yolu düzgün formatta mı kontrol et
  if (imagePath.startsWith('/uploads/') || imagePath.startsWith('uploads/')) {
    return getBackendUrl(imagePath);
  }
  
  return imagePath;
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Debug için
    console.log('Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      params: config.params,
    });

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Debug için
    console.log('Response:', {
      status: response.status,
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  async (error) => {
    // Detaylı hata loglaması
    console.error('Response error details:', {
      message: error.message,
      response: {
        data: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
      },
      request: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data,
      },
      stack: error.stack
    });
    
    const originalRequest = error.config;
    
    // Refresh token istekleri için sonsuz döngüyü önle
    if (error.response?.status === 401 && originalRequest.url === '/auth/refresh') {
      // Token yenileme başarısız, kullanıcıyı logout yap
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // 401 hatası ve özel refresh token özelliği yoksa
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Token yenileme zaten devam ediyor, isteği kuyruğa ekle
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Refresh token'ı localStorage'dan al
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('Refresh token bulunamadı');
        }
        
        // Refresh token ile yeni access token al
        const response = await api.post('/auth/refresh', {
          refreshToken: refreshToken
        });
        
        if (response.data.access_token) {
          // Yeni token'ı sakla
          localStorage.setItem('token', response.data.access_token);
          if (response.data.refresh_token) {
            localStorage.setItem('refreshToken', response.data.refresh_token);
          }
          
          // Axios instance için default header'ları güncelle
          api.defaults.headers.common['Authorization'] = 'Bearer ' + response.data.access_token;
          
          // Başarılı yenileme, kuyruğu işle
          processQueue(null, response.data.access_token);
          
          // Orijinal isteği yeni token ile tekrar gönder
          originalRequest.headers['Authorization'] = 'Bearer ' + response.data.access_token;
          return api(originalRequest);
        } else {
          throw new Error('Refresh token geçersiz');
        }
      } catch (refreshError) {
        // Token yenileme başarısız, kuyruğu hata ile işle
        processQueue(refreshError as Error, null);
        
        console.error('Token yenileme hatası:', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // Hata mesajını ekrana yansıtmak için login sayfasına gizli parametre ekle
        window.location.href = '/login?tokenExpired=true';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    } else if (!error.response && error.message === 'Network Error') {
      console.error('Backend sunucusuna erişilemiyor. Sunucunun çalıştığından emin olun.');
    }
    
    return Promise.reject(error);
  }
);

export default api; 