// Safe require to prevent crashes in production where devDependencies are missing
let withBundleAnalyzer = (config) => config;

if (process.env.ANALYZE === 'true') {
  try {
    withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
    });
  } catch (e) {
    // Fail silently if module is missing (production environment)
    console.warn('Bundle analyzer not enabled: @next/bundle-analyzer not found');
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'i.ytimg.com',
      'firebasestorage.googleapis.com',
      'i.scdn.co',
      'inv.nadeko.net',
      'invidious.privacyredirect.com',
      'yewtu.be',
      'vid.puffyan.us',
      'invidious.projectsegfau.lt',
      'onion.tube',
      'invidious.fdn.fr'
    ],
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
