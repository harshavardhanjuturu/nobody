import React from 'react';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import SkillsClient from './SkillsClient';

export const revalidate = 0; // Dynamic rendering

export default async function SkillsPage() {
  const user = await getSessionUser();
  
  const posts = await db.skillPost.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <SkillsClient
      posts={posts}
      defaultUserName={user?.name || ''}
      defaultUserPhone={user?.phoneNumber || ''}
      isSkillExchanger={user?.isSkillExchanger || false}
    />
  );
}
