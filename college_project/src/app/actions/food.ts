'use server';

import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { sendPushToUser } from '@/app/actions/push';
import { sendNotificationEmail } from '@/lib/email';

export async function placeOrder(items: any[], total: number) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!items || items.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    const order = await db.order.create({
      data: {
        userId: user.id,
        items: JSON.stringify(items),
        total,
        status: 'pending',
      },
    });

    revalidatePath('/food');
    revalidatePath('/');

    // Send push notification to user
    const itemSummary = items.slice(0, 2).map((i: any) => i.name).join(', ');
    const notificationText = `Your order of ${itemSummary}${items.length > 2 ? ` +${items.length - 2} more` : ''} (₹${total.toFixed(2)}) has been placed successfully.`;
    
    await sendPushToUser(
      user.id,
      '✅ Order Confirmed!',
      notificationText,
      '/food'
    );

    // Send email notification to user's registered email via configured email
    if (user.email) {
      await sendNotificationEmail(
        user.email,
        'Order Confirmed - Nobody Campus Dining',
        '✅ Order Confirmed!',
        notificationText,
        'http://localhost:3000/food'
      );
    }

    return { success: true, orderId: order.id };
  } catch (error: any) {
    console.error('Place order error:', error);
    return { success: false, error: error.message };
  }
}

export async function cancelOrder(orderId: string) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // 1. Safely update order status to cancelled
    await db.order.updateMany({
      where: { id: orderId },
      data: { status: 'cancelled' },
    });

    // 2. Safely update associated DeliveryGig status to cancelled
    await db.deliveryGig.updateMany({
      where: { orderId },
      data: { status: 'cancelled' },
    });

    revalidatePath('/food');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Cancel order error:', error);
    return { success: true };
  }
}

export async function confirmOrderReceipt(orderId: string) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    await db.order.updateMany({
      where: { id: orderId },
      data: { status: 'completed' },
    });

    revalidatePath('/food');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Confirm order receipt error:', error);
    return { success: true };
  }
}

export async function createFoodItem(
  name: string,
  description: string,
  price: number,
  category: string,
  discount?: string,
  hotelName?: string,
  imageUrl?: string
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Only Portal Administrator can create food items.' };
    }

    if (!name || !description || !price || !category) {
      return { success: false, error: 'All required fields must be provided.' };
    }

    await db.foodItem.create({
      data: {
        name,
        description,
        price,
        category,
        hotelName: hotelName || 'Campus Dining',
        discount: discount || null,
        imageUrl: imageUrl || null,
        isAvailable: true,
      },
    });

    revalidatePath('/food');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Create food item error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateFoodItem(
  id: string,
  name: string,
  description: string,
  price: number,
  category: string,
  discount?: string,
  isAvailable: boolean = true,
  hotelName?: string,
  imageUrl?: string
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Only Portal Administrator can edit food items.' };
    }

    if (!name || !description || !price || !category) {
      return { success: false, error: 'All required fields must be provided.' };
    }

    await db.foodItem.update({
      where: { id },
      data: {
        name,
        description,
        price,
        category,
        discount: discount || null,
        isAvailable,
        ...(hotelName ? { hotelName } : {}),
        ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
      },
    });

    revalidatePath('/food');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Update food item error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteFoodItem(id: string) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Only Portal Administrator can delete food items.' };
    }

    await db.foodItem.delete({
      where: { id },
    });

    revalidatePath('/food');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Delete food item error:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleFoodItemAvailability(id: string, isAvailable: boolean) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Only Portal Administrator can toggle item availability.' };
    }

    await db.foodItem.update({
      where: { id },
      data: { isAvailable },
    });

    revalidatePath('/food');
    return { success: true };
  } catch (error: any) {
    console.error('Toggle availability error:', error);
    return { success: false, error: error.message };
  }
}

export async function getAllOrders() {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const orders = await db.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, orders };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitFoodRating(foodItemId: string, rating: number, comment?: string) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: 'Please sign in to rate items.' };
    }

    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5 stars.' };
    }

    // Upsert user review
    const existingReview = await db.foodReview.findFirst({
      where: { foodItemId, userId: user.id },
    });

    if (existingReview) {
      await db.foodReview.update({
        where: { id: existingReview.id },
        data: { rating, comment: comment || null },
      });
    } else {
      await db.foodReview.create({
        data: {
          foodItemId,
          userId: user.id,
          rating,
          comment: comment || null,
        },
      });
    }

    // Recalculate average rating & review count for item
    const allReviews = await db.foodReview.findMany({
      where: { foodItemId },
    });

    const totalScore = allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
    const avgRating = Number((totalScore / allReviews.length).toFixed(1));

    await db.foodItem.update({
      where: { id: foodItemId },
      data: {
        rating: avgRating,
        reviewCount: allReviews.length,
      },
    });

    revalidatePath('/food');
    revalidatePath('/');
    return { success: true, rating: avgRating, reviewCount: allReviews.length };
  } catch (error: any) {
    console.error('Submit food rating error:', error);
    return { success: false, error: error.message };
  }
}

export async function getFoodItemReviews(foodItemId: string) {
  try {
    const reviews = await db.foodReview.findMany({
      where: { foodItemId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, reviews };
  } catch (error: any) {
    console.error('Get food reviews error:', error);
    return { success: false, error: error.message, reviews: [] };
  }
}
