import { readFile } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { transpileModule, ScriptTarget, ModuleKind } from 'typescript';
import { runtimeEnv } from './runtime-env.server';

afterEach(() => vi.unstubAllEnvs());

it('keeps Node environment variables and legacy test bindings usable', async () => {
  vi.stubEnv('MAITU_ENV_TEST', 'node');
  expect((await runtimeEnv()).MAITU_ENV_TEST).toBe('node');
  const AI = { run: vi.fn() };
  expect(await runtimeEnv({ env: { MAITU_ENV_TEST: 'legacy', AI } })).toMatchObject({ MAITU_ENV_TEST: 'legacy', AI });
});

it('reads actual Worker bindings without event.platform in the Cloudflare runtime', async () => {
  const source = await readFile(new URL('./runtime-env.server.ts', import.meta.url), 'utf8');
  const compiled = transpileModule(source, { compilerOptions: { target: ScriptTarget.ES2022, module: ModuleKind.ESNext } }).outputText;
  const script = compiled + `\nexport default { async fetch() {
    const env = await runtimeEnv();
    const response = await env.AI.fetch('https://mock-ai/');
    return Response.json({ marker: env.MAITU_ENV_TEST, ai: await response.text() });
  } };`;
  const mf = new Miniflare(convertV4MiniflareOptions({
    modules: true, script, compatibilityDate: '2026-10-08', compatibilityFlags: ['nodejs_compat'],
    bindings: { MAITU_ENV_TEST: 'cloudflare' },
    serviceBindings: { AI: () => new Response('mock-inference') },
  }));
  try {
    const response = await mf.dispatchFetch('https://maitu.test/');
    expect(await response.json()).toEqual({ marker: 'cloudflare', ai: 'mock-inference' });
  } finally { await mf.dispose(); }
});
