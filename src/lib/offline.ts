import { createOfflineEngine } from './offline/engine';
export const engine = createOfflineEngine({
  logout: async () => {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    if (!response.ok) throw new Error('Could not sign out on the server');
  },
});
export const offline = {
  subscribe: (
    notify: (state: ReturnType<typeof engine.getSnapshot>) => void,
  ) => {
    notify(engine.getSnapshot());
    return engine.subscribe(() => notify(engine.getSnapshot()));
  },
};
