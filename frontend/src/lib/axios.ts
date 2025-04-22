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
    console.error('Response error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (!error.response && error.message === 'Network Error') {
      console.error('Backend sunucusuna erişilemiyor. Sunucunun çalıştığından emin olun.');
    }
    
    return Promise.reject(error);
  }
);

export default api; 