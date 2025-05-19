'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, User, LogOut, Menu, X } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationsContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount, isLoading, openNotifications } = useNotifications();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isInstructorDashboard = pathname?.includes('/instructor/');

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getProfileUrl = () => {
    if (user?.role === 'student') {
      return '/student/profile';
    } else if (user?.role === 'instructor') {
      return '/instructor/profile';
    }
    return '/profile';
  };

  return (
    <nav className="bg-white backdrop-blur-sm bg-opacity-80 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link 
                href={user?.role === 'instructor' ? '/instructor/dashboard' : user?.role === 'student' ? '/student/dashboard' : '/'} 
                className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
              >
                E-Learning
              </Link>
            </div>
            
            {/* Desktop menu */}
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              {user && !isInstructorDashboard && user?.role !== 'instructor' && (
                <Link
                  href={user?.role === 'student' ? "/student/courses" : "/courses"}
                  className={`inline-flex items-center px-1 py-4 text-sm font-medium border-b-2 ${
                    pathname.includes('/courses') 
                      ? 'border-indigo-500 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Kurslar
                </Link>
              )}
              
              {user?.role === 'student' && (
                <>
                  <Link
                    href="/student/my-courses"
                    className={`inline-flex items-center px-1 py-4 text-sm font-medium border-b-2 ${
                      pathname === '/student/my-courses' 
                        ? 'border-purple-500 text-gray-900' 
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Kayıtlı Kurslarım
                  </Link>
                  <Link
                    href="/student/enrollment-history"
                    className={`inline-flex items-center px-1 py-4 text-sm font-medium border-b-2 ${
                      pathname === '/student/enrollment-history' 
                        ? 'border-pink-500 text-gray-900' 
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Kayıt Geçmişi
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
          
          {/* Right side - User actions */}
          <div className="hidden sm:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={openNotifications}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-indigo-600 relative transition-colors duration-200"
                >
                  <Bell className="h-5 w-5" />
                  {!isLoading && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center bg-red-500 text-white rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                <div className="flex items-center space-x-2 pl-2">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 mr-2">
                    {user.username}
                  </span>
                </div>
                
                <div className="h-6 w-px bg-gray-200"></div>
                
                <Link
                  href={getProfileUrl()}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                >
                  <User className="h-4 w-4 mr-1" />
                  <span>Profilim</span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span>Çıkış Yap</span>
                </button>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium rounded-full text-indigo-600 border border-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium rounded-full text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-md transition-all duration-200"
                >
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`sm:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          {user && !isInstructorDashboard && user?.role !== 'instructor' && (
            <Link
              href={user?.role === 'student' ? "/student/courses" : "/courses"}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
            >
              Kurslar
            </Link>
          )}
          
          {user?.role === 'student' && (
            <>
              <Link
                href="/student/my-courses"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              >
                Kayıtlı Kurslarım
              </Link>
              <Link
                href="/student/enrollment-history"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              >
                Kayıt Geçmişi
              </Link>
            </>
          )}
          
          {user ? (
            <>
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user.username}</div>
                  </div>
                  <button
                    onClick={openNotifications}
                    className="ml-auto p-1 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-gray-100 focus:outline-none"
                  >
                    <Bell className="h-6 w-6" />
                    {!isLoading && unreadCount > 0 && (
                      <span className="absolute top-2 right-2 h-4 w-4 text-xs flex items-center justify-center bg-red-500 text-white rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </div>
                <div className="mt-3 space-y-1 px-2">
                  <Link
                    href={getProfileUrl()}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  >
                    Profilim
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  >
                    Çıkış Yap
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-4 pt-4 pb-3 border-t border-gray-200">
              <div className="space-y-2 px-4">
                <Link
                  href="/login"
                  className="block w-full px-4 py-2 text-center text-sm font-medium rounded-full text-indigo-600 border border-indigo-600 hover:bg-indigo-50"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  className="block w-full px-4 py-2 text-center text-sm font-medium rounded-full text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                >
                  Kayıt Ol
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 