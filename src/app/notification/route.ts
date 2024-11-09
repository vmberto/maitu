import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { PushSubscription } from 'web-push';
import webPush, { WebPushError } from 'web-push';

type SuccessResponse = {
  success: boolean;
  message?: string;
};

type ErrorResponse = {
  error: string;
};

const createJsonResponse = (
  data: SuccessResponse | ErrorResponse,
  status: number,
) => {
  return NextResponse.json(data, { status });
};

export const POST = async (req: NextRequest) => {
  const {
    NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
    WEB_PUSH_EMAIL,
    WEB_PUSH_PRIVATE_KEY,
  } = process.env;

  if (
    !NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ||
    !WEB_PUSH_EMAIL ||
    !WEB_PUSH_PRIVATE_KEY
  ) {
    return createJsonResponse(
      { error: 'Environment variables are not properly set.' },
      500,
    );
  }

  try {
    const body = await req.json();
    const { subscription } = body as { subscription: PushSubscription };

    if (!subscription || typeof subscription !== 'object') {
      return createJsonResponse({ error: 'Invalid subscription object.' }, 400);
    }

    webPush.setVapidDetails(
      `mailto:${WEB_PUSH_EMAIL}`,
      NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
      WEB_PUSH_PRIVATE_KEY,
    );

    const payload = JSON.stringify({
      title: 'Hello Web Push',
      message: 'Your web push notification is here!',
    });

    // Send the notification
    await webPush.sendNotification(subscription, payload);

    // Return a success response
    return createJsonResponse({ success: true }, 200);
  } catch (err: any) {
    // Handle specific WebPush errors
    if (err instanceof WebPushError) {
      return createJsonResponse({ error: err.message }, err.statusCode || 500);
    }

    return createJsonResponse({ error: 'Internal Server Error' }, 500);
  }
};
