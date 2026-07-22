import React from 'react';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import FoodClient from './FoodClient';

export const revalidate = 0; // Dynamic rendering

export default async function FoodPage() {
  const user = await getSessionUser();
  
  // Fetch food items grouped by hotel
  const foodItems = await db.foodItem.findMany({
    orderBy: [{ hotelName: 'asc' }, { category: 'asc' }, { name: 'asc' }]
  });

  // Fetch active orders for current user
  let activeOrders: any[] = [];
  let orderHistory: any[] = [];
  if (user) {
    activeOrders = await db.order.findMany({
      where: {
        userId: user.id,
        status: {
          in: ['pending', 'preparing']
        }
      },
      include: {
        deliveryGig: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    orderHistory = await db.order.findMany({
      where: {
        userId: user.id,
        status: {
          in: ['completed', 'cancelled']
        }
      },
      include: {
        deliveryGig: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
  }

  return (
    <FoodClient 
      foodItems={foodItems} 
      activeOrders={activeOrders}
      orderHistory={orderHistory}
      isFoodVendor={user?.isFoodVendor || false}
      userRole={user?.role}
    />
  );
}
