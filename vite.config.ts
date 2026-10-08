import { defineConfig, loadEnv } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-node';
import cloudflare from '@sveltejs/adapter-cloudflare';
import path from 'node:path';
import vercel from '@sveltejs/adapter-vercel';
import { copyFile, readFile } from 'node:fs/promises';
const root = process.cwd();
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '');
  for (const key of ['SECRET_KEY', 'MONGODB_URI', 'E2E_TEST', 'PHOTON_URL'])
    if (!process.env[key] && env[key]) process.env[key] = env[key];
  const deployment = process.env.VERCEL
    ? vercel({ runtime: 'nodejs24.x' })
    : process.env.CLOUDFLARE || process.env.CF_PAGES
      ? cloudflare()
      : adapter();
  return {
    plugins: [
      sveltekit({
        serviceWorker: { register: false },
        adapter: {
          ...deployment,
          async adapt(builder) {
            const script = await readFile(
              '.svelte-kit/output/client/service-worker.js',
              'utf8',
            );
            if (/\b(?:import\s*\(|import\s+|export\s+)/.test(script))
              throw new Error(
                'Compatibility worker must remain a standalone classic script.',
              );
            await copyFile(
              '.svelte-kit/output/client/service-worker.js',
              '.svelte-kit/output/client/sw.js',
            );
            await deployment.adapt(builder);
          },
        },
        files: { assets: path.join(root, 'public') },
      }),
    ],
    server: { fs: { allow: [root] } },
  };
});
