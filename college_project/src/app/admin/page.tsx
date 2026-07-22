import React from 'react';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import AdminClient from './AdminClient';

export const revalidate = 0;

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/');

  const [users, orders, foodItems, events, groups, posts, disputes] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: 'desc' } }),
    db.order.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } }),
    db.foodItem.findMany({ orderBy: [{ hotelName: 'asc' }, { name: 'asc' }] }),
    db.event.findMany({ include: { group: true }, orderBy: { createdAt: 'desc' } }),
    db.communityGroup.findMany({ orderBy: { name: 'asc' } }),
    db.post.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' }, take: 20 }),
    db.disputeReport.findMany({
      include: {
        reporter: { select: { id: true, name: true, email: true, phoneNumber: true } },
        reportedUser: { select: { id: true, name: true, email: true, phoneNumber: true, isSuspended: true } },
        order: true,
        gig: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const stats = {
    users: users.length,
    orders: orders.length,
    foodItems: foodItems.length,
    events: events.length,
    posts: posts.length,
    pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
    openDisputes: disputes.filter((d: any) => d.status === 'open' || d.status === 'investigating').length,
  };

  return (
    <AdminClient
      currentUser={{ id: user.id, name: user.name, role: user.role }}
      users={users}
      orders={orders}
      foodItems={foodItems}
      events={events}
      groups={groups}
      disputes={disputes}
      stats={stats}
    />
  );
}
