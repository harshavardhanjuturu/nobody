'use server';

import { db } from '@/lib/db';
import { setSessionCookie, clearSessionCookie, getSessionUser } from '@/lib/auth';
import { sendOTPEmail, sendNotificationEmail } from '@/lib/email';

// Generate a random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper to find user by flexible phone (with/without +91/10-digit) or email
async function findUserByPhoneOrEmail(input: string, inputEmail?: string) {
  if (!input && !inputEmail) return null;
  const cleaned = (input || '').trim();
  const digitsOnly = cleaned.replace(/\D/g, '');
  const tenDigits = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

  const conditions: any[] = [];
  if (cleaned) {
    conditions.push({ phoneNumber: cleaned });
    if (tenDigits) {
      conditions.push({ phoneNumber: `+91${tenDigits}` });
      conditions.push({ phoneNumber: tenDigits });
    }
    if (cleaned.includes('@')) {
      conditions.push({ email: cleaned.toLowerCase() });
    }
  }
  if (inputEmail) {
    conditions.push({ email: inputEmail.toLowerCase() });
  }

  return await db.user.findFirst({
    where: { OR: conditions },
  });
}

export async function requestOTP(phoneNumber: string, email: string, isRegister?: boolean) {
  try {
    const cleanedEmail = (email || '').trim().toLowerCase();
    const cleanedPhone = (phoneNumber || '').trim();
    const digitsOnly = cleanedPhone.replace(/\D/g, '');
    const tenDigits = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
    const formattedPhone = tenDigits.length === 10 ? `+91${tenDigits}` : cleanedPhone;

    if (!cleanedEmail || !cleanedEmail.includes('@')) {
      return { success: false, error: 'A valid email address is required for verification.' };
    }

    // Check if user exists flexibly
    const existingUser = await findUserByPhoneOrEmail(cleanedPhone || cleanedEmail, cleanedEmail);

    let targetEmail = cleanedEmail;
    let targetPhone = formattedPhone;

    if (!isRegister) {
      if (existingUser) {
        targetEmail = existingUser.email;
        targetPhone = existingUser.phoneNumber || formattedPhone;
      } else if (!targetEmail) {
        return { success: false, error: 'Account not found for this email. Please register first.' };
      }
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Clear any leftover previous session cookie when initiating a new auth request
    await clearSessionCookie();

    // Save to database
    await db.oTPSession.create({
      data: {
        phoneNumber: targetPhone || '+910000000000',
        email: targetEmail,
        otp,
        expiresAt,
      },
    });

    console.log(`[AUTH] Generated Email OTP for ${targetEmail}: ${otp}`);

    // Send email via central email service (using EMAIL_USER from .env)
    const emailRes = await sendOTPEmail(targetEmail, otp);
    let mailErrorMsg: string | null = null;

    if (!emailRes.success) {
      console.warn(`[AUTH] SMTP delivery warning for ${targetEmail}:`, emailRes.error);
      mailErrorMsg = emailRes.error || 'SMTP delivery issue';
    }

    return { 
      success: true, 
      message: `Verification code sent to ${targetEmail}`,
      phoneNumber: targetPhone,
      email: targetEmail,
      mailError: mailErrorMsg,
    };
  } catch (error: any) {
    console.error('Request OTP error:', error);
    return { success: false, error: error.message || 'Something went wrong. Please try again.' };
  }
}

export async function verifyOTP(phoneNumber: string, otp: string, name?: string) {
  try {
    if (!otp) {
      return { success: false, error: 'Verification code is required.' };
    }

    const session = await db.oTPSession.findFirst({
      where: {
        otp: otp.trim(),
        verified: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) {
      return { success: false, error: 'Invalid or expired verification code.' };
    }

    if (new Date() > session.expiresAt) {
      return { success: false, error: 'Verification code has expired. Please request a new code.' };
    }

    // Mark as verified
    await db.oTPSession.update({
      where: { id: session.id },
      data: { verified: true },
    });

    const targetPhone = phoneNumber || session.phoneNumber;
    let user = await findUserByPhoneOrEmail(targetPhone, session.email);

    if (user && user.isSuspended) {
      return {
        success: false,
        error: `⛔ Account Suspended: ${user.suspensionReason || 'Your account has been suspended due to policy violations. Contact admin.'}`,
      };
    }

    if (!user) {
      const avatars = [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      ];
      const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@nobody.com').toLowerCase();
      const userRole = session.email.toLowerCase() === adminEmail ? 'admin' : 'student';

      user = await db.user.create({
        data: {
          phoneNumber: targetPhone || '+910000000000',
          email: session.email,
          name: name || `Student ${session.email.split('@')[0]}`,
          role: userRole,
          avatarUrl: randomAvatar,
        },
      });
      console.log(`[AUTH] Onboarded new user via email verification: ${user.name} (${user.email}) [Role: ${userRole}]`);
    }

    await clearSessionCookie();
    await setSessionCookie(user.id);

    return { success: true, user, redirectTo: user.role === 'admin' ? '/admin' : '/' };
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return { success: false, error: error.message || 'Something went wrong. Please try again.' };
  }
}

export async function verifyOTPForOnboarding(phoneNumber: string, otp: string) {
  try {
    if (!otp) {
      return { success: false, error: 'Verification code is required.' };
    }

    // Match by OTP and unverified state (and optionally email/phone)
    const session = await db.oTPSession.findFirst({
      where: { 
        otp: otp.trim(), 
        verified: false 
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) {
      return { success: false, error: 'Invalid verification code.' };
    }

    // Check expiry
    if (new Date() > session.expiresAt) {
      return { success: false, error: 'Verification code has expired. Please request a new one.' };
    }

    await db.oTPSession.update({ where: { id: session.id }, data: { verified: true } });

    const searchPhone = phoneNumber || session.phoneNumber;
    const existingUser = await findUserByPhoneOrEmail(searchPhone, session.email);

    if (existingUser) {
      if (existingUser.isSuspended) {
        return {
          success: false,
          error: `⛔ Account Suspended: ${existingUser.suspensionReason || 'Your account has been suspended due to policy violations.'}`,
        };
      }
      // Already registered — sign in directly
      await clearSessionCookie();
      await setSessionCookie(existingUser.id);
      return { success: true, needsOnboarding: false, user: existingUser };
    }

    // New user — needs onboarding
    return { success: true, needsOnboarding: true, email: session.email, phoneNumber: searchPhone };
  } catch (error: any) {
    console.error('verifyOTPForOnboarding error:', error);
    return { success: false, error: error.message || 'Something went wrong.' };
  }
}

export async function registerUser(
  phoneNumber: string,
  email: string,
  name: string,
  onboarding: { isFreelancer: boolean; isSkillExchanger: boolean; isFoodVendor: boolean }
) {
  try {
    const existingUser = await findUserByPhoneOrEmail(phoneNumber, email);
    let user;

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@nobody.com').toLowerCase();
    const userRole = email.trim().toLowerCase() === adminEmail ? 'admin' : 'student';

    if (existingUser) {
      user = await db.user.update({
        where: { id: existingUser.id },
        data: {
          name: name || existingUser.name,
          email: email || existingUser.email,
          phoneNumber: phoneNumber || existingUser.phoneNumber,
          role: existingUser.role === 'admin' ? 'admin' : 'student',
          isFreelancer: onboarding.isFreelancer,
          isSkillExchanger: onboarding.isSkillExchanger,
          isFoodVendor: onboarding.isFoodVendor,
        },
      });
      console.log(`[AUTH] Updated existing user via onboarding: ${user.name} (Role: ${user.role})`);
    } else {
      const avatars = [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      ];
      const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

      user = await db.user.create({
        data: {
          phoneNumber: phoneNumber || '+910000000000',
          email,
          name,
          role: userRole,
          avatarUrl: randomAvatar,
          isFreelancer: onboarding.isFreelancer,
          isSkillExchanger: onboarding.isSkillExchanger,
          isFoodVendor: onboarding.isFoodVendor,
        },
      });
      console.log(`[AUTH] Registered new user via onboarding: ${user.name} (Role: ${user.role})`);

      // Send welcome notification email
      await sendNotificationEmail(
        email,
        'Welcome to Nobody!',
        `Welcome to Nobody, ${name}! 🎉`,
        `Your account has been successfully created and verified. You can now access campus dining, peer food deliveries, skill sharing, freelancing, and community events directly from your portal.`
      );
    }

    await clearSessionCookie();
    await setSessionCookie(user.id);
    return { success: true, user, redirectTo: user.role === 'admin' ? '/admin' : '/' };
  } catch (error: any) {
    console.error('registerUser error:', error);
    return { success: false, error: error.message || 'Registration failed.' };
  }
}

export async function logout() {
  await clearSessionCookie();
  return { success: true };
}

export async function getCurrentUser() {
  try {
    const user = await getSessionUser();
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function googleSignIn(credentialToken: string) {
  try {
    if (!credentialToken) {
      return { success: false, error: 'Google credential token is required.' };
    }

    // Verify token with Google Token Info endpoint
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credentialToken}`);
    if (!res.ok) {
      return { success: false, error: 'Invalid Google token.' };
    }

    const payload = await res.json();
    const { email, name, picture, sub } = payload;

    if (!email) {
      return { success: false, error: 'Could not retrieve email from Google token.' };
    }

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@nobody.com').toLowerCase();
    const isAdmin = email.toLowerCase() === adminEmail;
    const userRole = isAdmin ? 'admin' : 'student';

    // Find user by email
    let user = await db.user.findFirst({
      where: { email },
    });

    if (!user) {
      // Create user if not exists
      const dummyPhone = `+1${sub.slice(0, 10)}`;
      user = await db.user.create({
        data: {
          email,
          name: name || (isAdmin ? 'System Admin' : 'Google User'),
          phoneNumber: dummyPhone,
          role: userRole,
          avatarUrl: picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        },
      });
      console.log(`[AUTH] Registered new user via Google Sign-In: ${user.name} (${user.email}) [Role: ${userRole}]`);
    } else if (isAdmin && user.role !== 'admin') {
      user = await db.user.update({
        where: { id: user.id },
        data: { role: 'admin' }
      });
    }

    await setSessionCookie(user.id);
    return { success: true, user, redirectTo: user.role === 'admin' ? '/admin' : '/' };
  } catch (error: any) {
    console.error('googleSignIn error:', error);
    return { success: false, error: error.message || 'Google Sign-In failed.' };
  }
}

export async function adminLogin(email: string, password: string) {
  try {
    const configuredAdminEmail = (process.env.ADMIN_EMAIL || 'admin@nobody.com').toLowerCase();
    const configuredAdminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    if (email.trim().toLowerCase() !== configuredAdminEmail) {
      return { success: false, error: 'Invalid email or password.' };
    }

    if (password !== configuredAdminPassword) {
      return { success: false, error: 'Invalid email or password.' };
    }

    // Find or create admin user
    let admin = await db.user.findFirst({
      where: { email: email.trim().toLowerCase() }
    });

    if (!admin) {
      admin = await db.user.create({
        data: {
          email: email.trim().toLowerCase(),
          name: 'Portal Administrator',
          phoneNumber: '+910000000000',
          role: 'admin',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          isFoodVendor: true,
          isFreelancer: true,
          isSkillExchanger: true
        }
      });
    } else if (admin.role !== 'admin') {
      admin = await db.user.update({
        where: { id: admin.id },
        data: { role: 'admin', isFoodVendor: true }
      });
    }

    await setSessionCookie(admin.id);
    return { success: true, user: admin, redirectTo: '/admin' };
  } catch (error: any) {
    console.error('adminLogin error:', error);
    return { success: false, error: error.message || 'Authentication failed.' };
  }
}
