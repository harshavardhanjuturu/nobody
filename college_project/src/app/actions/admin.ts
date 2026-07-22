'use server';

import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required.');
  }
  return user;
}

export async function getAllUsers() {
  await requireAdmin();
  return db.user.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function setUserRole(userId: string, role: string) {
  await requireAdmin();
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath('/admin');
  return { success: true };
}

export async function setUserSectors(
  userId: string,
  sectors: { isFreelancer: boolean; isSkillExchanger: boolean; isFoodVendor: boolean }
) {
  await requireAdmin();
  await db.user.update({ where: { id: userId }, data: sectors });
  revalidatePath('/admin');
  return { success: true };
}

export async function getAllOrders() {
  await requireAdmin();
  return db.order.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function adminUpdateOrderStatus(orderId: string, status: string) {
  await requireAdmin();
  await db.order.update({ where: { id: orderId }, data: { status } });
  revalidatePath('/admin');
  return { success: true };
}

export async function adminDeleteUser(userId: string) {
  await requireAdmin();
  await db.user.delete({ where: { id: userId } });
  revalidatePath('/admin');
  return { success: true };
}

export async function adminGetStats() {
  await requireAdmin();
  const [users, orders, foodItems, posts, events, disputes] = await Promise.all([
    db.user.count(),
    db.order.count(),
    db.foodItem.count(),
    db.post.count(),
    db.event.count(),
    db.disputeReport.count({ where: { status: { in: ['open', 'investigating'] } } }),
  ]);
  return { users, orders, foodItems, posts, events, openDisputes: disputes };
}

export async function adminGetDisputes() {
  await requireAdmin();
  return db.disputeReport.findMany({
    include: {
      reporter: { select: { id: true, name: true, email: true, phoneNumber: true } },
      reportedUser: { select: { id: true, name: true, email: true, phoneNumber: true, isSuspended: true } },
      order: true,
      gig: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function adminResolveDispute(
  disputeId: string,
  status: 'resolved' | 'dismissed' | 'account_suspended',
  adminNotes?: string
) {
  await requireAdmin();
  const dispute = await db.disputeReport.update({
    where: { id: disputeId },
    data: { status, adminNotes: adminNotes || null },
  });

  if (status === 'account_suspended') {
    await db.user.update({
      where: { id: dispute.reportedUserId },
      data: { isSuspended: true, suspensionReason: `Account suspended via admin dispute resolution #${disputeId.slice(0, 8)}.` },
    });
  }

  revalidatePath('/admin');
  return { success: true };
}

export async function adminToggleUserSuspension(userId: string, isSuspended: boolean, reason?: string) {
  await requireAdmin();
  await db.user.update({
    where: { id: userId },
    data: {
      isSuspended,
      suspensionReason: isSuspended ? (reason || 'Suspended by Administrator') : null,
    },
  });
  revalidatePath('/admin');
  return { success: true };
}
