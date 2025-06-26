import type { NextConfig } from "next"; // NextConfig interface'i oluşturduk

const nextConfig: NextConfig = { // nextConfig objesi oluşturduk
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
  },
}; // nextConfig objesi oluşturduk

export default nextConfig; // nextConfig objesini döndürüyoruz
