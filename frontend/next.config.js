/** @type {import('next').NextConfig} */ // NextConfig interface'i oluşturduk
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/**',
      },
    ],
  },
} // nextConfig objesi oluşturduk

module.exports = nextConfig // nextConfig objesini döndürüyoruz