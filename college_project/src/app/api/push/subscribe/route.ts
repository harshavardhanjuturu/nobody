import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { endpoint, keys } = await request.json();
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return Response.json({ error: 'Invalid subscription data.' }, { status: 400 });
    }

    // Upsert: if same endpoint exists, update it for this user
    await db.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      update: {
        userId: user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('[PUSH SUBSCRIBE]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
