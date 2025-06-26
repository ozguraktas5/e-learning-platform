import { NextResponse } from 'next/server'; // NextResponse'u import ettik
import type { NextRequest } from 'next/server'; // NextRequest'u import ettik
import { jwtDecode } from 'jwt-decode'; // jwtDecode'u import ettik

interface DecodedToken { // DecodedToken interface'i oluşturduk
  sub: string;
  email: string;
  username: string;
  role: 'student' | 'instructor';
  exp: number;
}

export function middleware(request: NextRequest) { // middleware fonksiyonu oluşturduk
  // LocalStorage'daki token'ı da kontrol et
  const cookieToken = request.cookies.get('token')?.value || '';
  const url = request.nextUrl.clone();
  
  // Giriş gerektirmeyen sayfalar
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/courses',
    '/about',
    '/contact',
  ];
  
  // Öğrenci özel sayfaları
  const studentPaths = [
    '/student/dashboard',
    '/student/courses',
    '/student/my-courses',
    '/student/enrollment-history',
    '/student/notifications',
  ];
  
  // publicPaths'in içindeki path'leri kontrol ediyoruz
  const isPublicPath = publicPaths.some(path => 
    url.pathname === path || url.pathname.startsWith('/api/')
  ); // isPublicPath değişkeni oluşturduk
  
  const isStudentPath = studentPaths.some(path => 
    url.pathname.startsWith(path)
  ); // isStudentPath değişkeni oluşturduk
  
  // Yalnızca dashboard sayfasında ek koruma olmadan geçiş izni ver
  if (url.pathname === '/student/dashboard') {
    return NextResponse.next(); // NextResponse.next() fonksiyonu oluşturduk
  }
  
  // Token yoksa ve öğrenci sayfasına erişmeye çalışıyorsa login'e yönlendir
  if (!cookieToken && isStudentPath) {
    console.log('Cookie token yok, login sayfasına yönlendiriliyor');
    url.pathname = '/login';
    return NextResponse.redirect(url); // NextResponse.redirect(url) fonksiyonu oluşturduk
  }
  
  // Token yoksa ve korumalı sayfaya erişmeye çalışıyorsa login'e yönlendir
  if (!cookieToken && !isPublicPath) {
    url.pathname = '/login';
    return NextResponse.redirect(url); // NextResponse.redirect(url) fonksiyonu oluşturduk
  }
  
  try {
    if (cookieToken) {
      const decoded = jwtDecode<DecodedToken>(cookieToken); // jwtDecode fonksiyonu ile cookieToken'ı decode ediyoruz
      
      // Token süresi kontrolünü kaldırdık - Client tarafında refresh token mekanizması ile token yenileme yapılacak
      
      // Öğrenci yollarına erişim kontrolü - dashboard hariç
      if (url.pathname.startsWith('/student/') && url.pathname !== '/student/dashboard' && decoded.role !== 'student') {
        console.log('Kullanıcı öğrenci değil, ana sayfaya yönlendiriliyor');
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
      
      // Eğitmen yollarına erişim kontrolü
      if (url.pathname.startsWith('/instructor/') && decoded.role !== 'instructor') {
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }
  } catch (error) {
    console.error('Token decode error:', error);
    // Token decode hatası olsa bile dashboard'a erişime izin ver
    if (url.pathname === '/student/dashboard') {
      return NextResponse.next();
    }
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Tüm sayfalar
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 