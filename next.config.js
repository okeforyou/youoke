/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'i.ytimg.com',
      'firebasestorage.googleapis.com',
      'i.scdn.co',
      'mosaic.scdn.co',
      'wrapped-images.spotifycdn.com',
      'profile.line-scdn.net',
      'lh3.googleusercontent.com',
      'yt3.ggpht.com'
    ],
  },
  env: {
    NEXT_PUBLIC_COMMIT_HASH: (() => {
      try {
        return process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
          require('child_process').execSync('git rev-parse --short HEAD').toString().trim();
      } catch (e) {
        return 'unknown';
      }
    })(),
  },
  async rewrites() {
    return [
      {
        source: '/cast-receiver-youtube.html',
        destination: '/cast-receiver-youtube-static.html',
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: false,
  skipWaiting: true,
});

module.exports = withPWA(nextConfig);
