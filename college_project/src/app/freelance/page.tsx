import React from 'react';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import FreelanceClient from './FreelanceClient';

export const revalidate = 0; // Dynamic rendering

export default async function FreelancePage() {
  const user = await getSessionUser();
  
  const projects = await db.freelanceProject.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <FreelanceClient
      projects={projects}
      defaultClientName={user?.name || ''}
      defaultClientPhone={user?.phoneNumber || ''}
      isFreelancer={user?.isFreelancer || false}
    />
  );
}
