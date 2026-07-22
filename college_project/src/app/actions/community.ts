'use server';

import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function joinGroup(groupId: string) {
  try {
    await db.communityGroup.update({
      where: { id: groupId },
      data: {
        membersCount: {
          increment: 1,
        },
      },
    });

    revalidatePath('/community');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Join group error:', error);
    return { success: false, error: error.message };
  }
}

export async function rsvpEvent(eventId: string) {
  try {
    await db.event.update({
      where: { id: eventId },
      data: {
        membersCount: {
          increment: 1,
        },
      },
    });

    revalidatePath('/community');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('RSVP event error:', error);
    return { success: false, error: error.message };
  }
}

export async function createCommunityGroup(
  name: string,
  description: string,
  imageUrl?: string
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: 'You must be signed in to create a club.' };
    }

    if (!name.trim() || !description.trim()) {
      return { success: false, error: 'Name and description are required.' };
    }

    await db.communityGroup.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        imageUrl: imageUrl || null,
        membersCount: 1,
      },
    });

    revalidatePath('/community');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Create community group error:', error);
    return { success: false, error: error.message };
  }
}

export async function createEvent(
  title: string,
  description: string,
  date: string,
  groupId?: string,
  imageUrl?: string
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: 'You must be signed in to create an event.' };
    }

    if (!title.trim() || !description.trim() || !date.trim()) {
      return { success: false, error: 'Title, description, and date are required.' };
    }

    await db.event.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        date: date.trim(),
        groupId: groupId || null,
        imageUrl: imageUrl || null,
        membersCount: 0,
      },
    });

    revalidatePath('/community');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Create event error:', error);
    return { success: false, error: error.message };
  }
}
