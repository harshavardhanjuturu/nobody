import React from 'react';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import ProfileClient from './ProfileClient';
import { redirect } from 'next/navigation';

export const revalidate = 0; // Dynamic rendering

export default async function ProfilePage() {
  const user = await getSessionUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch stats
  const postsCount = await db.post.count({
    where: { userId: user.id }
  });

  const ordersCount = await db.order.count({
    where: { userId: user.id }
  });

  const stats = {
    postsCount,
    ordersCount
  };

  // Map database user type to profile user type
  const mappedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isFreelancer: user.isFreelancer,
    isSkillExchanger: user.isSkillExchanger,
    isFoodVendor: user.isFoodVendor,
  };

  return (
    <ProfileClient
      initialUser={mappedUser}
      stats={stats}
    />
  );
}
