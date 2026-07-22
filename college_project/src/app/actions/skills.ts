'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createSkillPost(
  title: string,
  description: string,
  skillOffered: string,
  skillWanted: string,
  userName: string,
  userPhone: string
) {
  try {
    if (!title || !description || !skillOffered || !skillWanted || !userName || !userPhone) {
      return { success: false, error: 'All fields are required.' };
    }

    await db.skillPost.create({
      data: {
        title,
        description,
        skillOffered,
        skillWanted,
        userName,
        userPhone,
      },
    });

    revalidatePath('/skills');
    return { success: true };
  } catch (error: any) {
    console.error('Create skill post error:', error);
    return { success: false, error: error.message };
  }
}
