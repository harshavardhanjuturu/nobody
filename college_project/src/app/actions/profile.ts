'use server';

import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function updateProfile(name: string, email: string, avatarUrl?: string) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!name || !email) {
      return { success: false, error: 'Name and email are required.' };
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        name,
        email,
        ...(avatarUrl && { avatarUrl }),
      },
    });

    revalidatePath('/profile');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Update profile error:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleSectorRegistration(sector: 'freelancer' | 'skills' | 'food') {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const updateData: any = {};
    if (sector === 'freelancer') {
      updateData.isFreelancer = !user.isFreelancer;
    } else if (sector === 'skills') {
      updateData.isSkillExchanger = !user.isSkillExchanger;
    } else if (sector === 'food') {
      updateData.isFoodVendor = !user.isFoodVendor;
    }

    await db.user.update({
      where: { id: user.id },
      data: updateData,
    });

    revalidatePath('/profile');
    revalidatePath('/freelance');
    revalidatePath('/skills');
    revalidatePath('/food');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Toggle sector error:', error);
    return { success: false, error: error.message };
  }
}
