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
      'yt3.googleusercontent.com',
      'lh3.googleusercontent.com'
    ],
  },
  env: {
    NEXT_PUBLIC_COMMIT_HASH: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
    NEXT_PUBLIC_APP_VERSION: require('./package.json').version,
    NEXT_PUBLIC_LATEST_UPDATES: (() => {
        try {
            return require('child_process').execSync('git log -n 3 --pretty=format:"%s"').toString();
        } catch (e) {
            return "Latest system optimizations and identity bridging.";
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
  transpilePackages: ['youtubei.js'],
}

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: false,
  skipWaiting: true,
});

module.exports = withPWA(nextConfig);
