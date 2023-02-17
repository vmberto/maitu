/** @type {import('next').NextConfig} */
import runtimeCaching from 'next-pwa/cache.js';

const withPWA = require('next-pwa')({
  dest: 'public',
  disableDevLogs: true,
  runtimeCaching
});

module.exports = withPWA({
  // config
});
