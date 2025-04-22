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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token) as DecodedToken;
        // Token'ın süresi dolmuş mu kontrol et
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          setUser(null);
        } else {
          setUser({
            id: decoded.sub,
            email: decoded.email,
            username: decoded.username,
            role: decoded.role,
          });
        }
      } catch (error) {
        console.error('Token decode error:', error);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (token: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const decoded = jwtDecode(token) as DecodedToken;
        if (decoded.exp * 1000 < Date.now()) {
          throw new Error('Token has expired');
        }
        
        localStorage.setItem('token', token);
        setUser({
          id: decoded.sub,
          email: decoded.email,
          username: decoded.username,
          role: decoded.role,
        });
        resolve();
      } catch (error) {
        console.error('Login error:', error);
        localStorage.removeItem('token');
        setUser(null);
        reject(error);
      }
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
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