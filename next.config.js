/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disableDevLogs: true
});

module.exports = withPWA({
  // config
});
