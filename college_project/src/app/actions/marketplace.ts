'use server';

import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createListing(
  title: string,
  description: string,
  price: number,
  category: string,
  sellerName: string,
  sellerPhone: string
) {
  try {
    if (!title || !description || !price || !category || !sellerName || !sellerPhone) {
      return { success: false, error: 'All fields are required.' };
    }

    if (price <= 0) {
      return { success: false, error: 'Price must be greater than 0.' };
    }

    // Curated images per category for a natural demo look
    const categoryImages: Record<string, string> = {
      Electronics: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
      Textbooks: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&q=80',
      Tickets: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=80',
      Furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
      Clothing: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80',
      Sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80',
      Other: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80',
    };

    const imageUrl = categoryImages[category] || categoryImages.Other;

    await db.marketplaceItem.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        price,
        category,
        sellerName: sellerName.trim(),
        sellerPhone: sellerPhone.trim(),
        imageUrl,
      },
    });

    revalidatePath('/marketplace');
    return { success: true };
  } catch (error: any) {
    console.error('Create marketplace item error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteMarketplaceListing(id: string) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    await db.marketplaceItem.delete({ where: { id } });

    revalidatePath('/marketplace');
    return { success: true };
  } catch (error: any) {
    console.error('Delete marketplace listing error:', error);
    return { success: false, error: error.message };
  }
}

export async function getMarketplaceListings(category?: string, search?: string) {
  try {
    const items = await db.marketplaceItem.findMany({
      where: {
        ...(category && category !== 'All' ? { category } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { description: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, items };
  } catch (error: any) {
    return { success: false, items: [], error: error.message };
  }
}
