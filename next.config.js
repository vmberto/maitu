/** @type {import('next').NextConfig} */
const runtimeCaching = require('next-pwa/cache.js');

const withPWA = require('next-pwa')({
  dest: 'public',
  disableDevLogs: true,
  runtimeCaching
});

module.exports = withPWA({
  // config
});
