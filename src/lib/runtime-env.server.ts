import type { PlaceAI } from './smart-place.server';

type RuntimeEnv = Record<string, string | undefined> & { AI?: PlaceAI };

export async function runtimeEnv(platform?: unknown): Promise<RuntimeEnv> {
  const legacy = (platform as { env?: RuntimeEnv } | undefined)?.env;
  if (legacy) return { ...process.env, ...legacy };
  try {
    // SvelteKit 3 exposes bindings through the Worker built-in, not event.platform.
    // Keep this import at runtime so Node builds can use process.env instead.
    const builtin = 'cloudflare:workers';
    const { env } = await import(/* @vite-ignore */ builtin);
    return { ...process.env, ...env };
  } catch {
    return process.env;
  }
}
