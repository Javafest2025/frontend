/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
