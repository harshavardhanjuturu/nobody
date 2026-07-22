import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'nobody-premium-secret-key-123456789';
const SESSION_COOKIE_NAME = 'nobody_session';

export function signToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    const payload = verifyToken(sessionCookie.value);
    if (!payload || !payload.userId) {
      return null;
    }

    let user = await db.user.findUnique({
      where: { id: payload.userId }
    });

    // If database record is missing on a fresh serverless instance, reconstruct and sync from verified JWT payload
    if (!user && payload.email) {
      try {
        user = await db.user.upsert({
          where: { id: payload.userId },
          update: {},
          create: {
            id: payload.userId,
            email: payload.email,
            name: payload.name || `Student ${payload.email.split('@')[0]}`,
            phoneNumber: payload.phoneNumber || '+910000000000',
            role: payload.role || 'student',
            avatarUrl: payload.avatarUrl || null,
          },
        });
      } catch (err) {
        console.warn('User upsert fallback warning:', err);
        return {
          id: payload.userId,
          email: payload.email,
          name: payload.name || 'Student',
          phoneNumber: payload.phoneNumber || '+910000000000',
          role: payload.role || 'student',
          avatarUrl: payload.avatarUrl || null,
        } as any;
      }
    }

    return user;
  } catch (error) {
    console.error('Error fetching session user:', error);
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  let userPayload: any = { userId };

  try {
    const u = await db.user.findUnique({ where: { id: userId } });
    if (u) {
      userPayload = {
        userId: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        phoneNumber: u.phoneNumber,
        avatarUrl: u.avatarUrl,
      };
    }
  } catch (e) {
    console.warn('Error embedding user payload:', e);
  }

  const token = signToken(userPayload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', { maxAge: 0, path: '/' });
}
