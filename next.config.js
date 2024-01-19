/** @type {import('next').NextConfig} */
const runtimeCaching = require('next-pwa/cache');

const nextDataIndex = runtimeCaching.findIndex(
  (entry) => entry.options.cacheName === 'next-data',
);

if (nextDataIndex !== -1) {
  runtimeCaching[nextDataIndex].handler = 'NetworkFirst';
} else {
  throw new Error('Failed to find next-data object in runtime caching');
}

const withPWA = require('next-pwa')({
  dest: 'public',
  runtimeCaching,
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest.json$/],
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  reactStrictMode: false,
});
