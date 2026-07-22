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

    const user = await db.user.findUnique({
      where: { id: payload.userId }
    });

    return user;
  } catch (error) {
    console.error('Error fetching session user:', error);
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  const token = signToken({ userId });
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
