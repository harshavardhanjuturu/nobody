import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { type NextRequest } from 'next/server';

// GET /api/messages?with=<userId>  — fetch thread
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const withUserId = request.nextUrl.searchParams.get('with');
  if (!withUserId) return Response.json({ error: 'Missing ?with param' }, { status: 400 });

  const messages = await db.message.findMany({
    where: {
      OR: [
        { fromUserId: user.id, toUserId: withUserId },
        { fromUserId: withUserId, toUserId: user.id },
      ],
    },
    include: { from: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  // Mark messages from the other user as read
  await db.message.updateMany({
    where: { fromUserId: withUserId, toUserId: user.id, read: false },
    data: { read: true },
  });

  return Response.json({ messages });
}

// POST /api/messages  — send a message
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { toUserId, content } = await request.json();
  if (!toUserId || !content?.trim()) {
    return Response.json({ error: 'toUserId and content are required.' }, { status: 400 });
  }

  // Verify recipient exists
  const recipient = await db.user.findUnique({ where: { id: toUserId } });
  if (!recipient) return Response.json({ error: 'Recipient not found.' }, { status: 404 });

  const message = await db.message.create({
    data: { fromUserId: user.id, toUserId, content: content.trim() },
    include: { from: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return Response.json({ message });
}
