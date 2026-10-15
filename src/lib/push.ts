export async function enablePush(accountId: string) {
  if (import.meta.env.DEV)
    throw new Error('Push notifications require a production build. Run npm run build:local, then npm start to test on localhost.');
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window))
    throw new Error('Push notifications are unavailable in this browser. On iPhone, install the app on your Home Screen first.');
  if (!navigator.onLine) throw new Error('Go online to enable notifications. Scheduling still works offline.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notifications are blocked. You can still schedule tasks. Enable notifications in browser settings to receive reminders here.');
  const headers = { 'X-Maitu-Account': accountId, 'Content-Type': 'application/json' };
  const config = await fetch('/api/push', { headers });
  const body = await config.json();
  if (!config.ok) throw new Error(body.error || 'Reminder delivery is not configured yet.');
  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;
  const encoded = body.publicKey.replace(/-/g, '+').replace(/_/g, '/');
  const key = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
  const subscription = await registration.pushManager.getSubscription() ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  const response = await fetch('/api/push', { method: 'POST', headers, body: JSON.stringify(subscription.toJSON()) });
  if (!response.ok) throw new Error((await response.json()).error || 'Could not register notifications.');
}

export async function disconnectPush(accountId?: string) {
  if (!accountId || !('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  const response = await fetch('/api/push', { method: 'DELETE', headers: { 'X-Maitu-Account': accountId, 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
  // Unsubscribe locally even if the account session has expired.
  await subscription.unsubscribe();
  if (!response.ok) throw new Error('Could not remove this notification device.');
}
