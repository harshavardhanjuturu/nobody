'use server';

import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createPost(content: string, imageUrl?: string) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!content || content.trim().length === 0) {
      return { success: false, error: 'Post content cannot be empty.' };
    }

    if (content.trim().length > 500) {
      return { success: false, error: 'Post content must be 500 characters or less.' };
    }

    const post = await db.post.create({
      data: {
        content: content.trim(),
        imageUrl: imageUrl || null,
        userId: user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, role: true },
        },
      },
    });

    revalidatePath('/social');
    return { success: true, post };
  } catch (error: any) {
    console.error('Create post error:', error);
    return { success: false, error: error.message };
  }
}

export async function likePost(postId: string) {
  try {
    await db.post.update({
      where: { id: postId },
      data: {
        likes: {
          increment: 1,
        },
      },
    });

    revalidatePath('/social');
    return { success: true };
  } catch (error: any) {
    console.error('Like post error:', error);
    return { success: false, error: error.message };
  }
}

export async function deletePost(postId: string) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post) {
      return { success: false, error: 'Post not found.' };
    }

    // Allow post owner or admin to delete
    if (post.userId !== user.id && user.role !== 'admin') {
      return { success: false, error: 'You can only delete your own posts.' };
    }

    await db.post.delete({ where: { id: postId } });

    revalidatePath('/social');
    return { success: true };
  } catch (error: any) {
    console.error('Delete post error:', error);
    return { success: false, error: error.message };
  }
}
