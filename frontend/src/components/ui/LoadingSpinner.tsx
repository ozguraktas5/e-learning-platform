import React from 'react';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingSpinner({ fullScreen = false, size = 'medium' }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'h-6 w-6 border-2',
    medium: 'h-10 w-10 border-2',
    large: 'h-16 w-16 border-3',
  };
  
  const containerClasses = fullScreen 
    ? "flex justify-center items-center min-h-screen"
    : "flex justify-center items-center p-1";

  return (
    <div className={containerClasses}>
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-t-indigo-500 border-r-purple-500 border-b-pink-500 border-l-transparent`}></div>
    </div>
  );
} 