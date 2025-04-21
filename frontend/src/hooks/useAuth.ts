import { useEffect, useState } from 'react';
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
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token) as DecodedToken;
        setUser({
          id: decoded.sub,
          email: decoded.email,
          username: decoded.username,
          role: decoded.role,
        });
      } catch (error) {
        console.error('Token decode error:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    const decoded = jwtDecode(token) as DecodedToken;
    setUser({
      id: decoded.sub,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return { user, loading, login, logout };
} 