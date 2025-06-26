'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';  // ReactNode ekledik
import { jwtDecode } from 'jwt-decode'; // jwt-decode kütüphanesini import ettik

interface User { // User interface'i oluşturduk
  id: string;
  email: string;
  username: string;
  role: 'student' | 'instructor';
}

interface DecodedToken { // DecodedToken interface'i oluşturduk
  sub: string;
  email: string;
  username: string;
  role: 'student' | 'instructor';
  exp: number;
}

interface AuthContextType { // AuthContextType interface'i oluşturduk
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshTokenIfNeeded: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined); // AuthContext oluşturduk

// Cookie yardımcı fonksiyonları
const setCookie = (name: string, value: string, days = 7) => { // setCookie fonksiyonu oluşturduk
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
};

const getCookie = (name: string) => { // getCookie fonksiyonu oluşturduk
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';').shift() || '');
  return '';
};

const deleteCookie = (name: string) => { // deleteCookie fonksiyonu oluşturduk
  document.cookie = name + '=; Max-Age=-99999999; path=/';
};

export function AuthProvider({ children }: { children: ReactNode }) { // AuthProvider fonksiyonu oluşturduk
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Token'ı hem localStorage hem cookie'ye kaydet
  const saveToken = (token: string) => { // saveToken fonksiyonu oluşturduk
    localStorage.setItem('token', token);
    setCookie('token', token);
  };

  // Token'ı hem localStorage hem cookie'den sil
  const removeToken = () => { // removeToken fonksiyonu oluşturduk
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    deleteCookie('token');
  };

  // Token'ın geçerli olup olmadığını kontrol et
  const isTokenValid = (token: string): boolean => { // isTokenValid fonksiyonu oluşturduk
    try {
      const decoded = jwtDecode(token) as DecodedToken;
      // 5 dakika marj ekleyerek kontrol et (backend'in saat farkı olabilir)
      return decoded.exp * 1000 > Date.now() - (5 * 60 * 1000);
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  // Gerekirse token'ı yenile
  const refreshTokenIfNeeded = async (): Promise<string | null> => { // refreshTokenIfNeeded fonksiyonu oluşturduk
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Token yoksa veya refresh token yoksa null dön
    if (!token || !refreshToken) {
      return null;
    }
    
    // Token hala geçerliyse, mevcut token'ı dön
    if (isTokenValid(token)) {
      return token;
    }
    
    try {
      // 3. parti bağımlılıklardan kaçınmak için doğrudan fetch API kullan
      // axios kullanmak sonsuz döngüye neden olabilir
      const response = await fetch('http://localhost:5000/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        throw new Error('Token yenileme başarısız');
      }
      
      const data = await response.json();
      
      if (data.access_token) {
        saveToken(data.access_token);
        
        // Yeni refresh token varsa onu da sakla
        if (data.refresh_token) {
          localStorage.setItem('refreshToken', data.refresh_token);
        }
        
        // User bilgilerini güncelle
        const decoded = jwtDecode(data.access_token) as DecodedToken;
        setUser({
          id: decoded.sub,
          email: decoded.email,
          username: decoded.username,
          role: decoded.role,
        });
        
        return data.access_token;
      }
      
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Hata durumunda token'ları temizle ve null dön
      removeToken();
      setUser(null);
      return null;
    }
  };

  useEffect(() => { // useEffect fonksiyonu oluşturduk
    // Client tarafında çalışmasını sağla (SSR için kontrol)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || getCookie('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (token && refreshToken) {  // Sadece hem token hem refresh token varsa işlem yap
        try {
          const decoded = jwtDecode(token) as DecodedToken;
          // Token'ın süresi dolmuş mu kontrol et
          if (decoded.exp * 1000 < Date.now()) {
            // Süresi dolmuşsa, refresh token ile yenilemeyi dene
            refreshTokenIfNeeded().then(newToken => {
              if (!newToken) {
                // Yenileme başarısız olursa logout
                removeToken();
                setUser(null);
              }
              setLoading(false);
            });
          } else {
            // Token geçerliyse cookie'ye de kaydet
            if (!getCookie('token')) {
              setCookie('token', token);
            }
            setUser({
              id: decoded.sub,
              email: decoded.email,
              username: decoded.username,
              role: decoded.role,
            });
            setLoading(false);
          }
        } catch (error) {
          console.error('Token decode error:', error);
          removeToken();
          setUser(null);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
  }, []);

  const login = async (token: string): Promise<void> => { // login fonksiyonu oluşturduk
    return new Promise((resolve, reject) => {
      try {
        const decoded = jwtDecode(token) as DecodedToken;
        if (decoded.exp * 1000 < Date.now()) {
          throw new Error('Token has expired');
        }
        
        saveToken(token);
        localStorage.setItem('userRole', decoded.role);
        setUser({
          id: decoded.sub,
          email: decoded.email,
          username: decoded.username,
          role: decoded.role,
        });
        resolve();
      } catch (error) {
        console.error('Login error:', error);
        removeToken();
        localStorage.removeItem('userRole');
        setUser(null);
        reject(error);
      }
    });
  };

  const logout = () => { // logout fonksiyonu oluşturduk
    removeToken();
    localStorage.removeItem('userRole');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshTokenIfNeeded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { // useAuth fonksiyonu oluşturduk
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 