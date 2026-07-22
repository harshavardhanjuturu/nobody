'use server';

import webpush from 'web-push';
import { db } from '@/lib/db';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url: string = '/'
) {
  try {
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId },
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub: any) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body, url })
        )
      )
    );

    // Clean up expired/invalid subscriptions
    const toDelete: string[] = [];
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        const err = result.reason as any;
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          toDelete.push(subscriptions[i].endpoint);
        }
      }
    });
    if (toDelete.length > 0) {
      await db.pushSubscription.deleteMany({ where: { endpoint: { in: toDelete } } });
    }

    return { success: true };
  } catch (error: any) {
    console.error('[PUSH] sendPushToUser error:', error);
    return { success: false, error: error.message };
  }
}
