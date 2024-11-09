'use client';

import type { MouseEventHandler } from 'react';
import { useEffect, useState } from 'react';

const base64ToUint8Array = (base64: string) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(b64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function SendNotification() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.serwist !== undefined
    ) {
      // run only in browser
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (
            sub &&
            !(
              sub.expirationTime &&
              Date.now() > sub.expirationTime - 5 * 60 * 1000
            )
          ) {
            setSubscription(sub);
            setIsSubscribed(true);
          }
        });
        setRegistration(reg);
      });
    }
  }, []);

  const subscribeButtonOnClick: MouseEventHandler<HTMLButtonElement> = async (
    event,
  ) => {
    if (!process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY) {
      throw new Error('Environment variables supplied not sufficient.');
    }
    if (!registration) {
      return;
    }
    event.preventDefault();
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToUint8Array(
        process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
      ),
    });
    // TODO: you should call your API to save subscription data on the server in order to send web push notification from the server
    setSubscription(sub);
    setIsSubscribed(true);
  };

  const unsubscribeButtonOnClick: MouseEventHandler<HTMLButtonElement> = async (
    event,
  ) => {
    if (!subscription) {
      return;
    }
    event.preventDefault();
    await subscription.unsubscribe();
    // TODO: you should call your API to delete or invalidate subscription data on the server
    setSubscription(null);
    setIsSubscribed(false);
  };

  const sendNotificationButtonOnClick: MouseEventHandler<
    HTMLButtonElement
  > = async (event) => {
    event.preventDefault();

    if (!subscription) {
      return;
    }

    try {
      await fetch('/notification', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
        }),
        signal: AbortSignal.timeout(10000),
      });
    } catch (err) {
      //
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={subscribeButtonOnClick}
        disabled={isSubscribed}
      >
        Subscribe
      </button>
      <button
        type="button"
        onClick={unsubscribeButtonOnClick}
        disabled={!isSubscribed}
      >
        Unsubscribe
      </button>
      <button
        type="button"
        onClick={sendNotificationButtonOnClick}
        disabled={!isSubscribed}
      >
        Send Notification
      </button>
    </>
  );
}
