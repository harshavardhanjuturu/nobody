import React from 'react';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import IdCardClient from './IdCardClient';

export const revalidate = 0;

export default async function StudentIdPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const postsCount = await db.post.count({ where: { userId: user.id } });
  const ordersCount = await db.order.count({ where: { userId: user.id } });

  return (
    <IdCardClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isFreelancer: user.isFreelancer,
        isSkillExchanger: user.isSkillExchanger,
        isFoodVendor: user.isFoodVendor,
      }}
      stats={{ postsCount, ordersCount }}
    />
  );
}
