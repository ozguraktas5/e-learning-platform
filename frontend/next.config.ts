import type { NextConfig } from "next"; // NextConfig interface'i oluşturduk

const nextConfig: NextConfig = { // nextConfig objesi oluşturduk
  eslint: {
    // Geçici olarak build sırasında ESLint'i devre dışı bırak
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Geçici olarak build sırasında TypeScript hatalarını devre dışı bırak
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
}; // nextConfig objesi oluşturduk

export default nextConfig; // nextConfig objesini döndürüyoruz
