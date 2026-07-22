import React from 'react';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import ChatClient from './ChatClient';

export const revalidate = 0;

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const recipient = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, avatarUrl: true, phoneNumber: true },
  });

  if (!recipient) redirect('/messages');

  return (
    <ChatClient
      currentUser={{ id: user.id, name: user.name, avatarUrl: user.avatarUrl }}
      recipient={recipient}
    />
  );
}
