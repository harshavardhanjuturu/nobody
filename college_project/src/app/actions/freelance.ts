'use server';

import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createProject(
  title: string,
  description: string,
  budget: number,
  duration: string,
  clientName: string,
  clientPhone: string
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: 'You must be signed in to post a gig.' };
    }

    if (!title || !description || !budget || !duration || !clientName || !clientPhone) {
      return { success: false, error: 'All fields are required.' };
    }

    if (budget <= 0) {
      return { success: false, error: 'Budget must be greater than 0.' };
    }

    await db.freelanceProject.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        budget,
        duration: duration.trim(),
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
      },
    });

    revalidatePath('/freelance');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Create freelance project error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteProject(id: string) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    await db.freelanceProject.delete({ where: { id } });

    revalidatePath('/freelance');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Delete freelance project error:', error);
    return { success: false, error: error.message };
  }
}

export async function getFreelanceProjects(search?: string) {
  try {
    const projects = await db.freelanceProject.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, projects };
  } catch (error: any) {
    return { success: false, projects: [], error: error.message };
  }
}
