'use client';

import React, { useEffect, useRef, useState } from 'react';
import MorphicImage from '@/components/MorphicImage';

interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  avatarUrl: string | null;
  isFreelancer: boolean;
  isSkillExchanger: boolean;
  isFoodVendor: boolean;
}

interface IdCardClientProps {
  user: User;
  stats: { postsCount: number; ordersCount: number };
}

export default function IdCardClient({ user, stats }: IdCardClientProps) {
  const qrRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  // Dynamically import qrcode only on client
  useEffect(() => {
    import('qrcode').then((QRCode) => {
      if (qrRef.current) {
        QRCode.toCanvas(
          qrRef.current,
          JSON.stringify({ id: user.id, name: user.name, role: user.role }),
          {
            width: 120,
            margin: 1,
            color: { dark: '#111215', light: '#ffffff' },
          },
          (err) => {
            if (!err) setQrGenerated(true);
          }
        );
      }
    });
  }, [user.id, user.name, user.role]);

  const badges: { label: string; icon: string; active: boolean }[] = [
    { label: 'Freelancer', icon: 'work', active: user.isFreelancer },
    { label: 'Skill Exchanger', icon: 'swap_horiz', active: user.isSkillExchanger },
    { label: 'Food Vendor', icon: 'storefront', active: user.isFoodVendor },
  ].filter((b) => b.active);

  const shortId = user.id.replace(/-/g, '').toUpperCase().slice(0, 12);

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #id-card-print-root { display: block !important; }
          #id-card-print-root * { display: initial !important; }
        }
      `}</style>

      <div className="max-w-xl mx-auto flex flex-col gap-8 pb-12">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-primary dark:text-white">Student ID Card</h1>
          <p className="text-sm text-secondary dark:text-[#a4a2a5]">Your digital campus identity — shareable and printable.</p>
        </div>

        {/* The Card */}
        <div id="id-card-print-root">
          <div
            className="relative rounded-[28px] overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #111215 0%, #1e2130 50%, #111215 100%)',
              boxShadow: '0 40px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
            }}
          >
            {/* Decorative glow orbs */}
            <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/[0.03] blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-white/[0.03] blur-3xl pointer-events-none" />

            {/* Top bar */}
            <div className="relative flex items-center justify-between px-7 pt-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-black text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                </div>
                <span className="text-white/90 font-bold text-sm tracking-tight">Nobody</span>
              </div>
              <span className="text-white/30 text-[10px] font-semibold uppercase tracking-[0.2em]">Student Identity Card</span>
            </div>

            {/* Main content */}
            <div className="relative flex gap-6 px-7 py-6">
              {/* Avatar */}
              <div className="shrink-0">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg">
                  <MorphicImage
                    src={user.avatarUrl || ''}
                    alt={user.name}
                    fallbackIcon="account_circle"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-2 w-24 h-24 flex items-center justify-center">
                  <canvas
                    ref={qrRef}
                    className="rounded-lg"
                    style={{ width: '96px', height: '96px', opacity: qrGenerated ? 1 : 0.3, transition: 'opacity 0.3s' }}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="flex flex-col gap-2.5">
                  <div>
                    <p className="text-white/40 text-[10px] font-semibold uppercase tracking-[0.15em] mb-0.5">Full Name</p>
                    <h2 className="text-white text-xl font-bold leading-tight truncate">{user.name}</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <p className="text-white/40 text-[10px] font-semibold uppercase tracking-[0.15em] mb-0.5">Student ID</p>
                      <p className="text-white/90 text-xs font-mono font-bold tracking-wide">#{shortId}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] font-semibold uppercase tracking-[0.15em] mb-0.5">Role</p>
                      <p className="text-white/90 text-xs font-semibold capitalize">{user.role}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] font-semibold uppercase tracking-[0.15em] mb-0.5">Email</p>
                      <p className="text-white/70 text-[11px] font-medium truncate">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] font-semibold uppercase tracking-[0.15em] mb-0.5">Phone</p>
                      <p className="text-white/70 text-[11px] font-medium">{user.phoneNumber}</p>
                    </div>
                  </div>

                  {/* Badges */}
                  {badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {badges.map((b) => (
                        <span
                          key={b.label}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-black bg-white"
                        >
                          <span className="material-symbols-outlined text-[11px]">{b.icon}</span>
                          {b.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-4 mt-3 pt-3 border-t border-white/10">
                  <div className="text-center">
                    <p className="text-white font-bold text-lg leading-none">{stats.postsCount}</p>
                    <p className="text-white/35 text-[9px] uppercase tracking-wider mt-0.5">Vibes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-lg leading-none">{stats.ordersCount}</p>
                    <p className="text-white/35 text-[9px] uppercase tracking-wider mt-0.5">Orders</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom strip */}
            <div className="relative px-7 py-3 border-t border-white/10 bg-white/[0.03] flex items-center justify-between">
              <p className="text-white/25 text-[9px] uppercase tracking-[0.2em] font-semibold">Premium Collegiate Concierge</p>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full bg-primary dark:bg-white text-white dark:text-black font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Print / Save PDF
          </button>
          <button
            onClick={async () => {
              if (navigator.share) {
                try {
                  await navigator.share({ title: `${user.name} — Nobody Student ID`, text: `Student ID: #${shortId}` });
                } catch {}
              } else {
                await navigator.clipboard.writeText(`Nobody Student ID — ${user.name} (#${shortId})`);
                alert('ID copied to clipboard!');
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full bg-surface-container-low dark:bg-surface-container-high text-primary dark:text-white font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            Share
          </button>
        </div>

        {/* QR hint */}
        <p className="text-center text-xs text-secondary dark:text-[#a4a2a5]">
          The QR code encodes your unique student identity — show it at campus checkpoints or events.
        </p>
      </div>
    </>
  );
}
