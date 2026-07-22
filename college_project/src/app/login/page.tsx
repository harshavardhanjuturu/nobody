'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { googleSignIn, adminLogin } from '@/app/actions/auth';

// ─── Types ───────────────────────────────────────────────────────────────────
type Flow = 'signin' | 'register';
type Step = 'request' | 'verify' | 'splash' | 'onboarding' | 'done';
type Direction = 'forward' | 'back';
type SignInMode = 'phone' | 'email';

interface OnboardingAnswers {
  goal: string;
  major: string;
  activities: string[];
  referral: string;
  roles: string[];
}

// ─── Onboarding Questions ─────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 'goal',
    icon: 'rocket_launch',
    question: "What's your main campus goal?",
    sub: "We'll personalise your experience around what matters most.",
    type: 'single',
    options: [
      { id: 'freelance', label: 'Freelancing', icon: 'work', desc: 'Earn from skills' },
      { id: 'skills', label: 'Skill Swap', icon: 'swap_horiz', desc: 'Trade knowledge' },
      { id: 'dining', label: 'Campus Dining', icon: 'restaurant', desc: 'Explore food deals' },
      { id: 'events', label: 'Events & Community', icon: 'event', desc: 'Connect with peers' },
    ],
  },
  {
    id: 'major',
    icon: 'school',
    question: 'What is your academic major?',
    sub: 'Helps us match you with relevant opportunities and peers.',
    type: 'single',
    options: [
      { id: 'engineering', label: 'Engineering & Tech', icon: 'code', desc: 'CS, ECE, Mech …' },
      { id: 'business', label: 'Business & Finance', icon: 'trending_up', desc: 'MBA, CA, Econ …' },
      { id: 'arts', label: 'Arts & Design', icon: 'palette', desc: 'Fine Arts, Arch …' },
      { id: 'sciences', label: 'Sciences & Research', icon: 'science', desc: 'Physics, Biotech …' },
    ],
  },
  {
    id: 'activities',
    icon: 'interests',
    question: 'Which activities excite you most?',
    sub: "Pick all that apply — we'll surface them in your feed.",
    type: 'multi',
    options: [
      { id: 'coding', label: 'Hackathons & Coding', icon: 'terminal', desc: 'Build things' },
      { id: 'music', label: 'Music & Performing', icon: 'music_note', desc: 'Gigs & open mics' },
      { id: 'sports', label: 'Sports & Fitness', icon: 'sports_soccer', desc: 'Teams & tournaments' },
      { id: 'startups', label: 'Startups & Ideas', icon: 'lightbulb', desc: 'Pitch & grow' },
    ],
  },
  {
    id: 'referral',
    icon: 'campaign',
    question: 'How did you hear about Nobody?',
    sub: "Just curious — helps us understand how we're growing.",
    type: 'single',
    options: [
      { id: 'friends', label: 'Friends & Peers', icon: 'group', desc: 'Word of mouth' },
      { id: 'posters', label: 'Campus Posters', icon: 'image', desc: 'Seen around college' },
      { id: 'social', label: 'Social Media', icon: 'share', desc: 'Instagram, X …' },
      { id: 'faculty', label: 'Faculty / Admin', icon: 'person_pin', desc: 'Recommended' },
    ],
  },
  {
    id: 'roles',
    icon: 'manage_accounts',
    question: 'How do you want to be part of Nobody?',
    sub: 'Enable seller or service features to unlock more on the platform.',
    type: 'multi',
    options: [
      { id: 'freelancer', label: 'Offer Freelance Work', icon: 'work_history', desc: 'Get hired for projects' },
      { id: 'skill_exchanger', label: 'Skill Exchange', icon: 'swap_horiz', desc: 'Teach & learn' },
      { id: 'food_vendor', label: 'Sell Food / Snacks', icon: 'storefront', desc: 'Open a campus stall' },
      { id: 'student', label: 'Just a Student', icon: 'backpack', desc: 'Browse & enjoy' },
    ],
  },
];

// ─── Mock Google Profiles ─────────────────────────────────────────────────────
const GOOGLE_PROFILES = [
  { name: 'Harsha Vardhan', email: 'juturuharshavardhan77@gmail.com', avatar: 'HV' },
  { name: 'Alex Parker', email: 'alex.parker@university.edu', avatar: 'AP' },
  { name: 'Priya Sharma', email: 'priya.sharma@college.ac.in', avatar: 'PS' },
];

// ─── SplashScreen ─────────────────────────────────────────────────────────────
function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    // Hold for 2.2 s after animation, then exit
    const holdTimer = setTimeout(() => setPhase('out'), 2400);
    return () => clearTimeout(holdTimer);
  }, []);

  useEffect(() => {
    if (phase === 'out') {
      const doneTimer = setTimeout(onDone, 600);
      return () => clearTimeout(doneTimer);
    }
  }, [phase, onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden ${
        phase === 'out' ? 'splash-exit-all' : 'splash-bg-enter'
      }`}
    >
      {/* Ambient radial glow */}
      <div className="splash-glow absolute w-[600px] h-[600px] rounded-full bg-white/8 blur-[120px] pointer-events-none" />
      <div className="splash-glow absolute w-[300px] h-[300px] rounded-full bg-white/12 blur-[60px] pointer-events-none" style={{ animationDelay: '1.5s' }} />

      {/* Main wordmark */}
      <div className="relative z-10 flex flex-col items-center gap-5 select-none">
        <h1
          className="splash-word text-white font-bold"
          style={{
            fontSize: 'clamp(3.5rem, 12vw, 7rem)',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          Nobody
        </h1>
        <p className="splash-sub text-white/40 text-xs tracking-[0.35em] uppercase font-medium">
          Premium Collegiate Concierge
        </p>
      </div>

      {/* Bottom minimal indicator */}
      <div className="splash-sub absolute bottom-12 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/30"
            style={{ animationDelay: `${1.3 + i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── OnboardingQuiz ───────────────────────────────────────────────────────────
function OnboardingQuiz({
  pendingPhone,
  pendingEmail,
  pendingName,
  onComplete,
}: {
  pendingPhone: string;
  pendingEmail: string;
  pendingName: string;
  onComplete: () => void;
}) {
  const { registerUser } = useAuth();
  const [qIndex, setQIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>('forward');
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    goal: '',
    major: '',
    activities: [],
    referral: '',
    roles: [],
  });
  const [animKey, setAnimKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const q = QUESTIONS[qIndex];
  const progress = ((qIndex) / QUESTIONS.length) * 100;

  const getValue = (id: string): string | string[] =>
    answers[id as keyof OnboardingAnswers];

  const isSelected = (optId: string) => {
    const val = getValue(q.id);
    return Array.isArray(val) ? val.includes(optId) : val === optId;
  };

  const toggleOption = (optId: string) => {
    if (q.type === 'single') {
      setAnswers((a) => ({ ...a, [q.id]: optId }));
    } else {
      setAnswers((a) => {
        const cur = a[q.id as keyof OnboardingAnswers] as string[];
        const next = cur.includes(optId)
          ? cur.filter((x) => x !== optId)
          : [...cur, optId];
        return { ...a, [q.id]: next };
      });
    }
  };

  const canAdvance = () => {
    const val = getValue(q.id);
    if (q.type === 'single') return val !== '';
    return (val as string[]).length > 0;
  };

  const goNext = async () => {
    if (!canAdvance()) return;
    if (qIndex < QUESTIONS.length - 1) {
      setDirection('forward');
      setAnimKey((k) => k + 1);
      setQIndex((i) => i + 1);
    } else {
      // Final step — submit
      setLoading(true);
      setError('');
      const roles = answers.roles as string[];
      const res = await registerUser(pendingPhone, pendingEmail, pendingName, {
        isFreelancer: roles.includes('freelancer'),
        isSkillExchanger: roles.includes('skill_exchanger'),
        isFoodVendor: roles.includes('food_vendor'),
      });
      setLoading(false);
      if (res.success) {
        onComplete();
      } else {
        setError(res.error || 'Registration failed. Please try again.');
      }
    }
  };

  const goBack = () => {
    if (qIndex === 0) return;
    setDirection('back');
    setAnimKey((k) => k + 1);
    setQIndex((i) => i - 1);
  };

  const slideClass =
    direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 bg-gradient-to-br from-black via-[#0d0d12] to-[#0a0a10]">
      {/* Card */}
      <div className="w-full max-w-lg">
        {/* Progress + step counter */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={goBack}
            disabled={qIndex === 0}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all disabled:opacity-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress + (100 / QUESTIONS.length)}%` }}
            />
          </div>
          <span className="text-white/40 text-xs font-semibold tabular-nums whitespace-nowrap">
            {qIndex + 1} / {QUESTIONS.length}
          </span>
        </div>

        {/* Question card */}
        <div key={animKey} className={`${slideClass}`}>
          {/* Header */}
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/8 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-white text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {q.icon}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white leading-tight mb-2">{q.question}</h2>
            <p className="text-sm text-white/45 leading-relaxed">{q.sub}</p>
          </div>

          {/* Options grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {q.options.map((opt) => {
              const sel = isSelected(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleOption(opt.id)}
                  className={`relative text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer group ${
                    sel
                      ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.12)]'
                      : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[22px] mb-2 block ${sel ? 'text-black' : 'text-white/60'}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {opt.icon}
                  </span>
                  <p className={`font-semibold text-sm leading-tight ${sel ? 'text-black' : 'text-white'}`}>
                    {opt.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${sel ? 'text-black/60' : 'text-white/35'}`}>
                    {opt.desc}
                  </p>
                  {sel && (
                    <span className="absolute top-3 right-3 material-symbols-outlined text-[16px] text-black"
                      style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={goNext}
            disabled={!canAdvance() || loading}
            className="w-full py-4 rounded-full bg-white text-black font-bold text-sm tracking-wide hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading
              ? 'Setting up your profile…'
              : qIndex === QUESTIONS.length - 1
              ? "Let's go →"
              : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Google Picker Modal ──────────────────────────────────────────────────────
function GooglePickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (profile: { name: string; email: string }) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-white dark:bg-[#111] border border-outline rounded-2xl p-6 shadow-2xl animate-scale-up">
        {/* Google branding */}
        <div className="flex items-center gap-2.5 mb-5">
          <svg width="22" height="22" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <div>
            <p className="font-semibold text-sm text-on-surface">Sign in with Google</p>
            <p className="text-xs text-secondary">Choose an account</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {GOOGLE_PROFILES.map((profile) => (
            <button
              key={profile.email}
              onClick={() => onSelect(profile)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low dark:hover:bg-surface-container-high transition-all cursor-pointer text-left w-full"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {profile.avatar}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-on-surface truncate">{profile.name}</p>
                <p className="text-xs text-secondary truncate">{profile.email}</p>
              </div>
              <span className="material-symbols-outlined text-secondary text-[18px] ml-auto shrink-0">chevron_right</span>
            </button>
          ))}
        </div>

        <p className="mt-4 text-[11px] text-secondary text-center leading-relaxed">
          Demo mock — no real Google OAuth required
        </p>
      </div>
    </>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const { user, requestOTP, verifyOTPForOnboarding, loading: authLoading } = useAuth();
  const router = useRouter();

  const [flow, setFlow] = useState<Flow>('signin');
  const [signInMode, setSignInMode] = useState<SignInMode>('phone');
  const [step, setStep] = useState<Step>('request');
  const [localPhone, setLocalPhone] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoModal, setInfoModal] = useState({ title: '', message: '', show: false });
  const [showGooglePicker, setShowGooglePicker] = useState(false);

  // Pending registration data (set after OTP verified for new users)
  const [pendingPhone, setPendingPhone] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingName, setPendingName] = useState('');

  // Credentials / Admin Login Inputs
  const [credEmailInput, setCredEmailInput] = useState('');
  const [credPasswordInput, setCredPasswordInput] = useState('');

  const handleCredentialLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await adminLogin(credEmailInput, credPasswordInput);
    setLoading(false);
    if (res.success) {
      window.location.href = res.redirectTo || '/admin';
    } else {
      setError(res.error || 'Authentication failed. Please check your credentials.');
    }
  };

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Initialize Real Google Identity Services (GIS)
  useEffect(() => {
    if (!clientId) return;

    // Suppress Next.js dev overlay for temporary GSI logger propagation
    const origError = console.error;
    console.error = (...args: any[]) => {
      if (typeof args[0] === 'string' && args[0].includes('GSI_LOGGER')) return;
      origError.apply(console, args);
    };

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: any) => {
              if (response.credential) {
                setLoading(true);
                const res = await googleSignIn(response.credential);
                setLoading(false);
                if (res.success) {
                  window.location.href = res.redirectTo || '/';
                } else {
                  setError(res.error || 'Google Sign-In failed.');
                }
              }
            },
          });
        } catch (e) {
          // Ignore init error during propagation
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      console.error = origError;
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [clientId]);

  const handleGoogleClick = () => {
    try {
      if ((window as any).google && clientId) {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed?.() || notification.isSkippedMomentary?.() || notification.getNotDisplayedReason?.()) {
            setShowGooglePicker(true);
          }
        });
      } else {
        setShowGooglePicker(true);
      }
    } catch (err) {
      setShowGooglePicker(true);
    }
  };

  const handleGoogleSelect = async (profile: { name: string; email: string }) => {
    setShowGooglePicker(false);
    setEmail(profile.email);
    setName(profile.name);
    setError('');
    setLoading(true);
    const res = await requestOTP('', profile.email, false);
    setLoading(false);
    if (res.success) {
      setStep('verify');
      setInfoModal({
        title: 'Verification Code Sent',
        message: `A 6-digit verification code has been sent to ${profile.email} via youseenobody1@gmail.com. Please check your inbox.`,
        show: true,
      });
    } else {
      setError(res.error || 'Failed to send OTP to Google account email.');
    }
  };

  // Redirect if already logged in (only when not explicitly registering)
  useEffect(() => {
    if (!authLoading && user && flow !== 'register' && step === 'request') {
      router.replace(user.role === 'admin' ? '/admin' : '/');
    }
  }, [user, authLoading, router, flow, step]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const isReg = flow === 'register';
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (isReg && !name.trim()) { setError('Please enter your full name.'); return; }
    if (isReg && localPhone.length !== 10) { setError('Please enter a valid 10-digit mobile number for contact.'); return; }

    setLoading(true);
    const fullPhone = localPhone ? `+91${localPhone}` : '';
    setPhoneNumber(fullPhone);

    const res = await requestOTP(fullPhone, email, isReg);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to send verification code.');
      return;
    }
    setStep('verify');

    if (res.mailError) {
      setInfoModal({
        title: 'Email Service Notice',
        message: `Verification request recorded, but email service reported: "${res.mailError}". Please check your inbox or SMTP credentials.`,
        show: true,
      });
    } else {
      setInfoModal({
        title: 'Code Sent ✓',
        message: `A 6-digit verification code has been sent to ${res.email || email} via Nobody Support (youseenobody1@gmail.com). Please check your email inbox.`,
        show: true,
      });
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Enter the 6-digit verification code.'); return; }
    setLoading(true);

    const res = await verifyOTPForOnboarding(phoneNumber, otp);
    setLoading(false);

    if (!res.success) { setError(res.error || 'Invalid verification code.'); return; }

    if (!res.needsOnboarding) {
      if (res.user?.role === 'admin') {
        window.location.href = '/admin';
        return;
      }
      setStep('splash');
    } else {
      setPendingPhone(res.phoneNumber || phoneNumber);
      setPendingEmail(res.email || email);
      setPendingName(name);
      setStep('splash');
    }
  };

  const handleSplashDone = useCallback(() => {
    if (pendingPhone) {
      setStep('onboarding');
    } else {
      if (user?.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }
    }
  }, [pendingPhone, user]);

  const handleOnboardingComplete = useCallback(() => {
    window.location.href = '/';
  }, []);

  // ── Render splash ──
  if (step === 'splash') {
    return <SplashScreen onDone={handleSplashDone} />;
  }

  // ── Render onboarding ──
  if (step === 'onboarding') {
    return (
      <OnboardingQuiz
        pendingPhone={pendingPhone}
        pendingEmail={pendingEmail}
        pendingName={pendingName}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // ── Render login / register form ──
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-tr from-[#f8f9fc] to-[#e7eaef] dark:from-[#0a0a0c] dark:to-[#121214]">
      <div className="w-full max-w-md glass-panel p-8 rounded-24 flex flex-col gap-6 relative overflow-hidden animate-fade-up">
        {/* Decorative blob */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/[0.04] dark:bg-white/[0.04] rounded-full blur-3xl pointer-events-none" />

        {/* Wordmark */}
        <div className="text-center flex flex-col items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary dark:text-white">Nobody</h1>
            <p className="text-secondary dark:text-[#a4a2a5] text-xs mt-1 tracking-wider uppercase">
              Email Verification Portal
            </p>
          </div>
        </div>

        {/* Flow Tabs */}
        {step === 'request' && (
          <div className="flex bg-surface-container dark:bg-surface-container-high rounded-full p-1">
            {(['signin', 'register'] as Flow[]).map((f) => (
              <button
                key={f}
                onClick={() => { setFlow(f); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                  flow === f
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                    : 'text-secondary dark:text-[#a4a2a5] hover:text-primary dark:hover:text-white'
                }`}
              >
                {f === 'signin' ? 'Sign In' : 'New Registration'}
              </button>
            ))}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-error/10 text-error text-sm font-medium border border-error/20 animate-fade-up">
            {error}
          </div>
        )}

        {/* ── Request Verification Code Form ── */}
        {step === 'request' && (
          <form onSubmit={handleRequestOTP} className="flex flex-col gap-4 animate-fade-up">
            {flow === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-[11px] font-bold uppercase tracking-wider text-neutral-800 dark:text-secondary">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Alex Parker"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-surface-container-high text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-secondary/75 border border-outline/70 focus:border-black dark:focus:border-white outline-none text-sm font-semibold transition-all shadow-xs"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-neutral-800 dark:text-secondary">
                Email Address (For Verification Code)
              </label>
              <input
                id="email"
                type="email"
                placeholder="your.name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-surface-container-high text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-secondary/75 border border-outline/70 focus:border-black dark:focus:border-white outline-none text-sm font-semibold transition-all shadow-xs"
              />
            </div>

            {flow === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-[11px] font-bold uppercase tracking-wider text-neutral-800 dark:text-secondary">
                  Contact Mobile Number
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center justify-center px-4 rounded-xl bg-white dark:bg-surface-container-high text-neutral-900 dark:text-white border border-outline/70 text-sm font-bold select-none shadow-xs">
                    +91
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={localPhone}
                    onChange={(e) => setLocalPhone(e.target.value.replace(/\D/g, ''))}
                    required
                    className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-surface-container-high text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-secondary/75 border border-outline/70 focus:border-black dark:focus:border-white outline-none text-sm font-semibold tracking-wider transition-all shadow-xs"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-full bg-primary dark:bg-white text-white dark:text-black font-bold text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              {loading ? 'Sending Code…' : 'Send Verification Code via Email'}
            </button>
          </form>
        )}

        {/* ── Verify Email OTP Form ── */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyOTP} className="flex flex-col gap-5 animate-fade-up">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container-low dark:bg-surface-container-high flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary dark:text-white text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  mark_email_read
                </span>
              </div>
              <p className="text-sm text-secondary leading-relaxed">
                Verification code sent to <strong className="text-primary dark:text-white">{email}</strong>
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="otp" className="text-[11px] font-bold uppercase tracking-wider text-secondary text-center">
                6-Digit Email Verification Code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                className="w-full px-4 py-4 text-center text-3xl tracking-[0.4em] font-bold rounded-xl bg-surface-container-low dark:bg-surface-container-high text-primary dark:text-white placeholder-secondary/75 border border-transparent focus:border-primary dark:focus:border-white outline-none transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep('request'); setOtp(''); setError(''); }}
                className="flex-1 py-3.5 rounded-full bg-surface-container-low dark:bg-surface-container-high text-primary dark:text-white font-semibold text-sm hover:opacity-80 transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="flex-1 py-3.5 rounded-full bg-primary dark:bg-white text-white dark:text-black font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Verifying…' : 'Verify Email →'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Google Picker Modal ── */}
      {showGooglePicker && (
        <GooglePickerModal
          onSelect={handleGoogleSelect}
          onClose={() => setShowGooglePicker(false)}
        />
      )}

      {/* ── Info Modal ── */}
      {infoModal.show && (
        <>
          <div
            onClick={() => setInfoModal((p) => ({ ...p, show: false }))}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-[#0d0d0f] border border-outline rounded-24 p-6 z-50 shadow-2xl flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center gap-2.5 text-primary dark:text-white">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                info
              </span>
              <h3 className="font-bold text-sm">{infoModal.title}</h3>
            </div>
            <p className="text-xs text-secondary leading-relaxed whitespace-pre-wrap">{infoModal.message}</p>
            <button
              onClick={() => setInfoModal((p) => ({ ...p, show: false }))}
              className="w-full py-2.5 rounded-full bg-primary dark:bg-white text-white dark:text-black font-bold text-xs hover:opacity-90 transition-all cursor-pointer"
            >
              Got it
            </button>
          </div>
        </>
      )}
    </div>
  );
}
