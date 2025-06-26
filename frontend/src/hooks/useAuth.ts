import { useEffect, useState } from 'react'; // useEffect ve useState kütüphanesini import ettik
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
}

export function useAuth() { // useAuth fonksiyonu oluşturduk 
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { // useEffect fonksiyonu oluşturduk
    const token = localStorage.getItem('token'); // token'ı localStorage'ten aldık
    if (token) {
      try {
        const decoded = jwtDecode(token) as DecodedToken; // token'ı decode ettik
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

  const login = (token: string) => { // login fonksiyonu oluşturduk
    localStorage.setItem('token', token); // token'ı localStorage'e kaydettik
    const decoded = jwtDecode(token) as DecodedToken; // token'ı decode ettik
    setUser({
      id: decoded.sub,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
    });
  };

  const logout = () => { // logout fonksiyonu oluşturduk
    localStorage.removeItem('token'); // token'ı localStorage'ten sil
    setUser(null);
  };

  return { user, loading, login, logout }; // user, loading, login ve logout fonksiyonlarını döndük
} 