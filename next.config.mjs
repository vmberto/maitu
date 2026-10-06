// @ts-check
import { randomUUID } from 'node:crypto';
import withSerwistInit from '@serwist/next';

const buildId = randomUUID();
const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV !== 'production',
  cacheOnNavigation: false,
  reloadOnOnline: false,
  additionalPrecacheEntries: [
    '/',
    '/tasks',
    '/timeline',
    '/tasks/map',
    '/archived',
    '/login',
  ].map((url) => ({ url, revision: buildId })),
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  generateBuildId: async () => buildId,
};
export default withSerwist(nextConfig);
