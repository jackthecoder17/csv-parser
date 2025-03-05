/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@tailwindcss/oxide'],
  experimental: {
    // Disable experimental features that might cause issues
    serverComponentsExternalPackages: [],
  },
}

module.exports = nextConfig
