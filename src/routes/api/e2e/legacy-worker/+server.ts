import { legacyWorker } from '#lib/legacy-worker.server';
export function GET() {
  return process.env.E2E_TEST === 'true'
    ? new Response(legacyWorker, {
        headers: {
          'Content-Type': 'application/javascript',
          'Service-Worker-Allowed': '/',
          'Cache-Control': 'no-store',
        },
      })
    : new Response(null, { status: 404 });
}
