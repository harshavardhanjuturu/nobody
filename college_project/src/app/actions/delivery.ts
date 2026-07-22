'use server';

import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { sendPushToUser } from '@/app/actions/push';
import { sendNotificationEmail } from '@/lib/email';

// Place order with optional peer delivery gig creation
export async function placeOrderWithDelivery(
  items: any[],
  total: number,
  deliveryType: 'pickup' | 'peer_delivery',
  deliveryAddress?: string,
  deliveryFee: number = 0
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!items || items.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    const grandTotal = total + (deliveryType === 'peer_delivery' ? deliveryFee : 0);

    const order = await db.order.create({
      data: {
        userId: user.id,
        items: JSON.stringify(items),
        total: grandTotal,
        status: 'pending',
        deliveryType,
        deliveryAddress: deliveryType === 'peer_delivery' ? deliveryAddress || 'Campus Drop-off' : null,
        deliveryFee: deliveryType === 'peer_delivery' ? deliveryFee : 0,
      },
    });

    let gigId: string | null = null;

    // If Peer Delivery, create an open DeliveryGig with Handshake PIN
    if (deliveryType === 'peer_delivery') {
      const deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();
      const gig = await db.deliveryGig.create({
        data: {
          orderId: order.id,
          status: 'open',
          deliveryCode,
        },
      });
      gigId = gig.id;

      // Broadcast push notification to all potential deliverers
      const potentialDeliverers = await db.user.findMany({
        where: { id: { not: user.id } },
        select: { id: true, email: true },
      });

      const itemSummary = items.slice(0, 2).map((i: any) => i.name).join(', ');
      for (const pd of potentialDeliverers) {
        await sendPushToUser(
          pd.id,
          '🛵 New Campus Delivery Request!',
          `Earn ₹${deliveryFee} delivering ${itemSummary} to ${deliveryAddress || 'Campus Drop-off'}!`,
          '/food?tab=radar'
        );
      }
    }

    // Push notification to buyer
    const itemSummary = items.slice(0, 2).map((i: any) => i.name).join(', ');
    const buyerNotifyText = `Your order of ${itemSummary} (₹${grandTotal.toFixed(2)}) has been placed successfully.`;
    
    await sendPushToUser(
      user.id,
      '✅ Order Confirmed!',
      buyerNotifyText,
      '/food'
    );

    if (user.email) {
      await sendNotificationEmail(
        user.email,
        'Order Confirmed - Nobody Campus Delivery',
        '✅ Order Confirmed!',
        buyerNotifyText,
        'http://localhost:3000/food'
      );
    }

    revalidatePath('/food');
    revalidatePath('/');
    return { success: true, orderId: order.id, gigId };
  } catch (error: any) {
    console.error('[DELIVERY] placeOrderWithDelivery error:', error);
    return { success: false, error: error.message };
  }
}

// Fetch open delivery gigs for student delivery partners
export async function getOpenDeliveryGigs() {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const gigs = await db.deliveryGig.findMany({
      where: {
        OR: [
          {
            status: 'open',
            order: {
              userId: { not: user.id },
              status: { notIn: ['cancelled', 'completed'] },
            },
          },
          {
            status: { in: ['accepted', 'picked_up'] },
            delivererId: user.id,
            order: { status: { notIn: ['cancelled', 'completed'] } },
          },
        ],
      },
      include: {
        order: {
          include: {
            user: {
              select: { id: true, name: true, phoneNumber: true, email: true, avatarUrl: true },
            },
          },
        },
        deliverer: {
          select: { id: true, name: true, phoneNumber: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, gigs, currentUserId: user.id };
  } catch (error: any) {
    console.error('[DELIVERY] getOpenDeliveryGigs error:', error);
    return { success: false, error: error.message };
  }
}

// Accept a delivery gig as a student deliverer
export async function acceptDeliveryGig(gigId: string) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const gig = await db.deliveryGig.findUnique({
      where: { id: gigId },
      include: { order: { include: { user: true } } },
    });

    if (!gig) return { success: false, error: 'Delivery gig not found' };

    if (gig.order?.status === 'cancelled' || gig.status === 'cancelled') {
      return {
        success: false,
        error: '❌ Order Cancelled: The customer cancelled this order request.',
      };
    }

    // Atomic update lock: Ensures strictly first-come, first-served
    const updated = await db.deliveryGig.updateMany({
      where: {
        id: gigId,
        status: 'open',
        order: { status: { notIn: ['cancelled', 'completed'] } },
      },
      data: {
        delivererId: user.id,
        status: 'accepted',
      },
    });

    if (updated.count === 0) {
      return {
        success: false,
        error: '⚡ Opportunity Claimed! Another student just accepted this delivery request first.',
      };
    }

    const updatedGig = await db.deliveryGig.findUnique({
      where: { id: gigId },
    });

    const buyerText = `${user.name} accepted your delivery request and is heading to the counter!`;

    // Notify buyer via push
    await sendPushToUser(
      gig.order.userId,
      '🎉 Peer Deliverer Accepted!',
      buyerText,
      '/food'
    );

    // Notify buyer via email
    if (gig.order.user?.email) {
      await sendNotificationEmail(
        gig.order.user.email,
        'Peer Deliverer Accepted - Nobody',
        '🎉 Peer Deliverer Accepted!',
        buyerText,
        'http://localhost:3000/food'
      );
    }

    revalidatePath('/food');
    revalidatePath('/');
    return { success: true, gig: updatedGig };
  } catch (error: any) {
    console.error('[DELIVERY] acceptDeliveryGig error:', error);
    return { success: false, error: error.message };
  }
}

// Update gig status (picked_up, delivered)
export async function updateGigStatus(gigId: string, status: 'picked_up' | 'delivered' | 'cancelled') {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const gig = await db.deliveryGig.findUnique({
      where: { id: gigId },
      include: { order: { include: { user: true } } },
    });

    if (!gig) return { success: false, error: 'Gig not found' };

    await db.deliveryGig.update({
      where: { id: gigId },
      data: { status },
    });

    // If delivered, also complete the order status
    if (status === 'delivered') {
      await db.order.update({
        where: { id: gig.orderId },
        data: { status: 'completed' },
      });
    }

    // Push notification to buyer based on status update
    const statusMessages: Record<string, string> = {
      picked_up: `🍛 ${user.name} picked up your food at the counter and is on the way!`,
      delivered: `🎉 Your order has been delivered by ${user.name}! Enjoy your meal!`,
      cancelled: `⚠️ Delivery status updated.`,
    };

    if (statusMessages[status]) {
      const msgTitle = status === 'delivered' ? '✅ Food Delivered!' : '🛵 Delivery Update';
      const msgBody = statusMessages[status];

      await sendPushToUser(
        gig.order.userId,
        msgTitle,
        msgBody,
        '/food'
      );

      if (gig.order.user?.email) {
        await sendNotificationEmail(
          gig.order.user.email,
          `${msgTitle} - Nobody Delivery`,
          msgTitle,
          msgBody,
          'http://localhost:3000/food'
        );
      }
    }

    revalidatePath('/food');
    return { success: true };
  } catch (error: any) {
    console.error('[DELIVERY] updateGigStatus error:', error);
    return { success: false, error: error.message };
  }
}

// Fetch delivery status for buyer's order
export async function getOrderDeliveryGig(orderId: string) {
  try {
    const gig = await db.deliveryGig.findUnique({
      where: { orderId },
      include: {
        deliverer: {
          select: { id: true, name: true, phoneNumber: true, avatarUrl: true },
        },
      },
    });

    return { success: true, gig };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Fetch all active orders, assigned delivery gigs, and open radar gigs for dashboard
export async function getDashboardActiveData() {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, myActiveOrders: [], myAssignedGigs: [], openGigs: [] };

    // 1. Fetch active orders placed by the current user
    const myActiveOrders = await db.order.findMany({
      where: {
        userId: user.id,
        status: { in: ['pending', 'preparing'] },
      },
      include: {
        deliveryGig: {
          include: {
            deliverer: {
              select: { id: true, name: true, phoneNumber: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch active gigs assigned to current user as deliverer
    const myAssignedGigs = await db.deliveryGig.findMany({
      where: {
        delivererId: user.id,
        status: { in: ['accepted', 'picked_up'] },
        order: { status: { notIn: ['cancelled', 'completed'] } },
      },
      include: {
        order: {
          include: {
            user: {
              select: { id: true, name: true, phoneNumber: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 3. Fetch open delivery requests available on campus
    const openGigs = await db.deliveryGig.findMany({
      where: {
        status: 'open',
        order: {
          userId: { not: user.id },
          status: { notIn: ['cancelled', 'completed'] },
        },
      },
      include: {
        order: {
          include: {
            user: {
              select: { id: true, name: true, phoneNumber: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      currentUserId: user.id,
      myActiveOrders,
      myAssignedGigs,
      openGigs,
    };
  } catch (error: any) {
    console.error('[DASHBOARD] getDashboardActiveData error:', error);
    return { success: false, error: error.message, myActiveOrders: [], myAssignedGigs: [], openGigs: [] };
  }
}

// Handshake PIN Verification: Deliverer enters buyer's 4-digit code to complete delivery safely
export async function verifyDeliveryHandshakeCode(gigId: string, inputCode: string) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const gig = await db.deliveryGig.findUnique({
      where: { id: gigId },
      include: { order: { include: { user: true } } },
    });

    if (!gig) return { success: false, error: 'Delivery gig not found.' };

    if (gig.delivererId !== user.id) {
      return { success: false, error: 'Only the assigned delivery partner can enter the Handshake PIN.' };
    }

    if (!gig.deliveryCode || gig.deliveryCode.trim() !== inputCode.trim()) {
      return {
        success: false,
        error: '❌ Invalid 4-Digit Handshake PIN. Please ask the customer for their 4-digit verification code.',
      };
    }

    // PIN matched! Update gig status to delivered and order status to completed
    await db.deliveryGig.update({
      where: { id: gigId },
      data: { status: 'delivered' },
    });

    await db.order.update({
      where: { id: gig.orderId },
      data: { status: 'completed' },
    });

    // Notify buyer
    const buyerText = `🎉 Handshake PIN verified! Your order was successfully delivered by ${user.name}.`;
    await sendPushToUser(gig.order.userId, '✅ Delivery Confirmed!', buyerText, '/food');

    if (gig.order.user?.email) {
      await sendNotificationEmail(
        gig.order.user.email,
        'Delivery Confirmed - Nobody',
        '✅ Delivery Confirmed!',
        buyerText,
        'http://localhost:3000/'
      );
    }

    revalidatePath('/food');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('[DELIVERY] verifyDeliveryHandshakeCode error:', error);
    return { success: false, error: error.message || 'Verification failed.' };
  }
}

// File a Dispute Report for Trust & Safety
export async function createDisputeReport(
  orderId: string,
  gigId: string | null,
  reportedUserId: string,
  reason: string,
  details: string
) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    if (!reportedUserId || !reason || !details) {
      return { success: false, error: 'All fields are required to submit a dispute report.' };
    }

    const reportedUser = await db.user.findUnique({ where: { id: reportedUserId } });

    const dispute = await db.disputeReport.create({
      data: {
        orderId,
        gigId: gigId || null,
        reporterId: user.id,
        reportedUserId,
        reason,
        details,
        status: 'open',
      },
    });

    // Directly email Admin for immediate review and decision making
    const adminEmail = process.env.ADMIN_EMAIL || 'youseenobody1@gmail.com';
    const emailSubject = `🚨 [URGENT DISPUTE] Report Filed by ${user.name} for Order #${orderId.slice(0, 8)}`;
    const emailBody = `
A new Trust & Safety dispute report has been filed on Nobody.

• Reported User: ${reportedUser?.name || reportedUserId} (${reportedUser?.email || 'No email'}, ${reportedUser?.phoneNumber || 'No phone'})
• Filed By: ${user.name} (${user.email}, ${user.phoneNumber})
• Reason: ${reason.replace('_', ' ').toUpperCase()}
• Incident Details: "${details}"
• Order ID: ${orderId}

Please review this dispute in the Admin Control Center to make a decision or suspend the account if necessary.
    `.trim();

    await sendNotificationEmail(
      adminEmail,
      emailSubject,
      '🚨 Urgent Trust & Safety Dispute Report',
      emailBody,
      'http://localhost:3000/admin'
    );

    // Check if reported user has multiple open disputes
    const openDisputeCount = await db.disputeReport.count({
      where: { reportedUserId, status: { in: ['open', 'investigating'] } },
    });

    // Auto-flag or suspend if >= 3 open disputes
    if (openDisputeCount >= 3) {
      await db.user.update({
        where: { id: reportedUserId },
        data: {
          isSuspended: true,
          suspensionReason: `Automated system suspension: ${openDisputeCount} active dispute reports pending review.`,
        },
      });
      console.warn(`[TRUST & SAFETY] Account ${reportedUserId} automatically suspended due to ${openDisputeCount} disputes.`);
    }

    revalidatePath('/admin');
    return { success: true, disputeId: dispute.id };
  } catch (error: any) {
    console.error('[TRUST & SAFETY] createDisputeReport error:', error);
    return { success: false, error: error.message || 'Failed to submit dispute.' };
  }
}

// Submit Mutual Review & Rating (Buyer <-> Deliverer)
export async function submitDeliveryReview(
  gigId: string,
  toUserId: string,
  rating: number,
  feedbackType: 'buyer_to_deliverer' | 'deliverer_to_buyer',
  comment?: string
) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5 stars.' };
    }

    await db.deliveryReview.create({
      data: {
        gigId,
        fromUserId: user.id,
        toUserId,
        rating,
        feedbackType,
        comment: comment || null,
      },
    });

    // Recalculate target user rating
    const allReviews = await db.deliveryReview.findMany({
      where: { toUserId, feedbackType },
    });

    const totalScore = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0);
    const avgRating = Number((totalScore / allReviews.length).toFixed(1));

    if (feedbackType === 'buyer_to_deliverer') {
      await db.user.update({
        where: { id: toUserId },
        data: { delivererRating: avgRating, delivererRatingCount: allReviews.length },
      });
    } else {
      await db.user.update({
        where: { id: toUserId },
        data: { buyerRating: avgRating, buyerRatingCount: allReviews.length },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('[TRUST & SAFETY] submitDeliveryReview error:', error);
    return { success: false, error: error.message };
  }
}

