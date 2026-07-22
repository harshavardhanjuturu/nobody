import React from 'react';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import MorphicImage from '@/components/MorphicImage';

export const revalidate = 0;

export default async function MessagesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  // Find all users that have a conversation with the current user
  const conversations = await db.message.findMany({
    where: {
      OR: [{ fromUserId: user.id }, { toUserId: user.id }],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      from: { select: { id: true, name: true, avatarUrl: true } },
      to: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  // Build unique conversation partners
  const partnersMap = new Map<string, { id: string; name: string; avatarUrl: string | null; lastMessage: string; lastTime: Date; unread: number }>();
  for (const msg of conversations) {
    const partner = msg.fromUserId === user.id ? msg.to : msg.from;
    if (!partnersMap.has(partner.id)) {
      const unread = conversations.filter(
        m => m.fromUserId === partner.id && m.toUserId === user.id && !m.read
      ).length;
      partnersMap.set(partner.id, {
        id: partner.id,
        name: partner.name,
        avatarUrl: partner.avatarUrl,
        lastMessage: msg.content,
        lastTime: msg.createdAt,
        unread,
      });
    }
  }
  const partners = Array.from(partnersMap.values());

  // All users for "new conversation"
  const allUsers = await db.user.findMany({
    where: { id: { not: user.id } },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, avatarUrl: true },
  });

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 pb-12">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-primary dark:text-white">Messages</h1>
        <p className="text-sm text-secondary dark:text-[#a4a2a5]">Direct messages with fellow students.</p>
      </div>

      {/* Conversation list */}
      <div className="flex flex-col gap-2">
        {partners.length === 0 ? (
          <div className="text-center py-10 text-secondary">
            <span className="material-symbols-outlined text-[48px] opacity-40 mb-2">chat_bubble_outline</span>
            <p className="text-sm font-medium">No conversations yet.</p>
            <p className="text-xs mt-1">Start a chat from the list below.</p>
          </div>
        ) : (
          partners.map((p) => (
            <Link
              key={p.id}
              href={`/messages/${p.id}`}
              className="base-card rounded-24 p-4 flex items-center gap-4 hover:scale-[1.005] transition-transform duration-200"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-outline">
                <MorphicImage src={p.avatarUrl || ''} alt={p.name} fallbackIcon="account_circle" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-primary dark:text-white">{p.name}</p>
                <p className="text-xs text-secondary truncate">{p.lastMessage}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <p className="text-[10px] text-secondary">{new Date(p.lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                {p.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary dark:bg-white text-white dark:text-black text-[9px] font-bold flex items-center justify-center">
                    {p.unread}
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      {/* New conversation — all users */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-secondary dark:text-[#a4a2a5]">All Students</h2>
        <div className="flex flex-col gap-2">
          {allUsers.map((u) => (
            <Link
              key={u.id}
              href={`/messages/${u.id}`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-low dark:hover:bg-surface-container-high transition-colors"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-outline">
                <MorphicImage src={u.avatarUrl || ''} alt={u.name} fallbackIcon="account_circle" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-medium text-primary dark:text-white">{u.name}</span>
              <span className="material-symbols-outlined text-secondary text-[18px] ml-auto">chevron_right</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
