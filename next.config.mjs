/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Add polyfills for server-side compatibility
  serverExternalPackages: [],
  images: {
    unoptimized: true,
    domains: ['scholarai-papers.s3.ams5.backblazeb2.com', 'res.cloudinary.com'],
  },

  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8080/api/v1/:path*',
      },
    ]
  },

  webpack(config, { isServer }) {
    // Prevent webpack from trying to bundle the native canvas addon
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      canvas: false,
    }

    return config
  },
}

export default nextConfig
