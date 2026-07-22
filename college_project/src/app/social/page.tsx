import React from 'react';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import SocialFeedClient from './SocialFeedClient';

export const revalidate = 0;

export default async function SocialPage() {
  const user = await getSessionUser();

  const posts = await db.post.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true, role: true },
      },
    },
    take: 50,
  });

  return (
    <SocialFeedClient
      initialPosts={posts.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      }))}
      currentUser={
        user
          ? {
              id: user.id,
              name: user.name,
              avatarUrl: user.avatarUrl,
              role: user.role,
            }
          : null
      }
    />
  );
}
