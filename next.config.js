const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['i.ytimg.com', 'firebasestorage.googleapis.com'],
  },
  async rewrites() {
    return [
      {
        source: '/cast-receiver-youtube.html',
        destination: '/cast-receiver-youtube-static.html',
      },
    ];
  },
}

module.exports = withBundleAnalyzer(nextConfig)
