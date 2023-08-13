const runtimeCaching = require('next-pwa/cache');
const withPWA = require('next-pwa')({
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest.json$/],
  dest: 'public',
  register: true,
  skipWaiting: false,
  trailingSlash: true,
  output: 'export',
  runtimeCaching
});
const nextConfig = withPWA({});

module.exports = nextConfig;
