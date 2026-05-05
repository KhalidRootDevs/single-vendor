/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint runs separately in CI; skip during next build to avoid circular JSON bug
    ignoreDuringBuilds: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com'
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com'
      },
      {
        protocol: 'https',
        hostname: 'example.com'
      }
    ]
  },
  // Suppress fetch errors during build (ECONNREFUSED from internal API calls)
  logging: {
    fetches: {
      fullUrl: false
    }
  }
};

export default nextConfig;
