import React from 'react';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import CommunityClient from './CommunityClient';

export const revalidate = 0;

export default async function CommunityPage() {
  const user = await getSessionUser();

  const groups = await db.communityGroup.findMany({
    orderBy: { membersCount: 'desc' },
  });

  const events = await db.event.findMany({
    include: { group: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <CommunityClient
      groups={groups}
      events={events}
      userId={user?.id}
    />
  );
}
