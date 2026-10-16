import { defineConfig, loadEnv } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-node';
import cloudflare from '@sveltejs/adapter-cloudflare';
import path from 'node:path';
import vercel from '@sveltejs/adapter-vercel';
import { copyFile, readFile, rename, writeFile, appendFile } from 'node:fs/promises';
const root = process.cwd();
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '');
  for (const key of ['SECRET_KEY', 'MONGODB_URI', 'E2E_TEST', 'PHOTON_URL', 'JINA_API_KEY', 'OPENAI_API_KEY', 'OPENAI_PLACE_MODEL', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT', 'CRON_SECRET'])
    if (!process.env[key] && env[key]) process.env[key] = env[key];
  const deployment = process.env.VERCEL
    ? vercel({ runtime: 'nodejs24.x' })
    : (process.env.CLOUDFLARE || process.env.CF_PAGES) && !process.env.E2E_TEST
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
            if ((process.env.CLOUDFLARE || process.env.CF_PAGES) && !process.env.E2E_TEST && !process.env.VERCEL) {
              await rename('.svelte-kit/cloudflare/_worker.js', '.svelte-kit/cloudflare/_app-worker.js');
              await appendFile('.svelte-kit/cloudflare/.assetsignore', '\n_app-worker.js\n_app-worker.js.map\n');
              await writeFile('.svelte-kit/cloudflare/_worker.js', `import app from './_app-worker.js';
export default {
  fetch: app.fetch,
  async scheduled(controller, env) {
    if (!env.CRON_SECRET || !env.APP_ORIGIN) throw new Error('Configure CRON_SECRET and APP_ORIGIN for reminders');
    const response = await app.fetch(new Request(new URL('/api/reminders/run', env.APP_ORIGIN), {
      headers: { authorization: 'Bearer ' + env.CRON_SECRET }
    }), env);
    if (!response.ok) throw new Error('Reminder cron failed: ' + response.status);
  }
};
`);
            }
          },
        },
        files: { assets: path.join(root, 'public') },
      }),
    ],
    server: { fs: { allow: [root] } },
  };
});
