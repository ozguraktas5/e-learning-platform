'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'student' | 'instructor';
}

interface DecodedToken {
  sub: string;
  email: string;
  username: string;
  role: 'student' | 'instructor';
  exp: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cookie yardımcı fonksiyonları
const setCookie = (name: string, value: string, days = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
};

const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';').shift() || '');
  return '';
};

const deleteCookie = (name: string) => {
  document.cookie = name + '=; Max-Age=-99999999; path=/';
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Token'ı hem localStorage hem cookie'ye kaydet
  const saveToken = (token: string) => {
    localStorage.setItem('token', token);
    setCookie('token', token);
  };

  // Token'ı hem localStorage hem cookie'den sil
  const removeToken = () => {
    localStorage.removeItem('token');
    deleteCookie('token');
  };

  useEffect(() => {
    // Client tarafında çalışmasını sağla (SSR için kontrol)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || getCookie('token');
      if (token) {
        try {
          const decoded = jwtDecode(token) as DecodedToken;
          // Token'ın süresi dolmuş mu kontrol et
          if (decoded.exp * 1000 < Date.now()) {
            removeToken();
            setUser(null);
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
          }
        } catch (error) {
          console.error('Token decode error:', error);
          removeToken();
          setUser(null);
        }
      }
      setLoading(false);
    }
  }, []);

  const login = async (token: string): Promise<void> => {
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

  const logout = () => {
    removeToken();
    localStorage.removeItem('userRole');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 