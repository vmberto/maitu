import { enablePush } from './push';

it('explains how to test push locally before requesting permission or registering a missing worker', async () => {
  vi.stubEnv('DEV', true);
  const fetch = vi.spyOn(globalThis, 'fetch');
  try {
    await expect(enablePush('account')).rejects.toThrow('npm run build:local, then npm start');
    expect(fetch).not.toHaveBeenCalled();
  } finally {
    fetch.mockRestore();
    vi.unstubAllEnvs();
  }
});
