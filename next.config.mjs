/** @type {import('next').NextConfig} */
const nextConfig = {
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
