import React from 'react';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import MorphicImage from '@/components/MorphicImage';
import DashboardDeliveryWidget from '@/components/DashboardDeliveryWidget';

export const revalidate = 0; // Dynamic rendering

export default async function DashboardPage() {
  const user = await getSessionUser();
  
  // Fetch dynamic highlights from the database
  const foodDeal = await db.foodItem.findFirst({
    where: { discount: { not: null } },
  });

  const latestEvent = await db.event.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  const latestProject = await db.freelanceProject.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  // Default fallback values if DB seed wasn't run
  const userName = user?.name || 'Alex Parker';
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Greeting & Weather Bento */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 glass-panel rounded-24 p-6 flex flex-col justify-between h-48 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 dark:from-white/5 to-transparent z-0"></div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-secondary dark:text-[#a4a2a5] uppercase tracking-wider">Welcome Back,</p>
            <h2 className="text-3xl font-bold tracking-tight text-primary dark:text-white mt-1">{userName}</h2>
          </div>
          <div className="relative z-10 flex items-center gap-2 mt-auto text-secondary dark:text-[#a4a2a5] text-sm">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            <span>{todayStr} • Week 8</span>
          </div>
        </div>
        
        <div className="col-span-1 base-card rounded-24 p-6 flex flex-col items-center justify-center h-48 hover:scale-[1.01] transition-transform duration-300">
          <span className="material-symbols-outlined text-[48px] text-primary dark:text-white mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
            cloud
          </span>
          <p className="text-3xl font-bold text-primary dark:text-white">68°</p>
          <p className="text-sm text-secondary dark:text-[#a4a2a5] mt-1">Partly Cloudy • Campus Quad</p>
        </div>
      </section>

      {/* Live Campus Delivery Request Widget */}
      <DashboardDeliveryWidget />

      {/* Quick Actions */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary dark:text-[#a4a2a5] mb-4">Quick Actions</h3>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          <Link href="/food" className="flex flex-col items-center gap-2 min-w-[80px] group">
            <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center group-hover:scale-105 transition-transform duration-300 active:scale-95">
              <span className="material-symbols-outlined text-[24px] text-primary dark:text-white">qr_code_scanner</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary dark:text-[#a4a2a5] group-hover:text-primary dark:group-hover:text-white transition-colors">Pay</span>
          </Link>
          
          <Link href="/skills" className="flex flex-col items-center gap-2 min-w-[80px] group">
            <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center group-hover:scale-105 transition-transform duration-300 active:scale-95">
              <span className="material-symbols-outlined text-[24px] text-primary dark:text-white">school</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary dark:text-[#a4a2a5] group-hover:text-primary dark:group-hover:text-white transition-colors">Skills</span>
          </Link>
          
          <Link href="/freelance" className="flex flex-col items-center gap-2 min-w-[80px] group">
            <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center group-hover:scale-105 transition-transform duration-300 active:scale-95">
              <span className="material-symbols-outlined text-[24px] text-primary dark:text-white">work</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary dark:text-[#a4a2a5] group-hover:text-primary dark:group-hover:text-white transition-colors">Jobs</span>
          </Link>
          
          <Link href="/community" className="flex flex-col items-center gap-2 min-w-[80px] group">
            <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center group-hover:scale-105 transition-transform duration-300 active:scale-95">
              <span className="material-symbols-outlined text-[24px] text-primary dark:text-white">event</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary dark:text-[#a4a2a5] group-hover:text-primary dark:group-hover:text-white transition-colors">Events</span>
          </Link>

          <Link href="/marketplace" className="flex flex-col items-center gap-2 min-w-[80px] group">
            <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center group-hover:scale-105 transition-transform duration-300 active:scale-95">
              <span className="material-symbols-outlined text-[24px] text-primary dark:text-white">shopping_bag</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary dark:text-[#a4a2a5] group-hover:text-primary dark:group-hover:text-white transition-colors">Store</span>
          </Link>
        </div>
      </section>

      {/* Continue Activity */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary dark:text-[#a4a2a5] mb-4">Active Study Session</h3>
        <div className="base-card rounded-24 p-6 flex items-center gap-4 hover:scale-[1.01] transition-transform duration-300 cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-surface-container-low dark:bg-surface-container-high flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary dark:text-white">library_books</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-secondary dark:text-[#a4a2a5] truncate">CS 301 - Data Structures</p>
            <p className="font-semibold text-primary dark:text-white truncate">Assignment 4 Review (Graph Traversals)</p>
          </div>
          <button className="w-10 h-10 rounded-full bg-primary dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">play_arrow</span>
          </button>
        </div>
      </section>

      {/* Highlights Bento */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Food Deal Highlight */}
        <Link href="/food">
          <div className="glass-panel rounded-24 p-6 hover:scale-[1.01] transition-transform duration-300 flex flex-col justify-between min-h-[220px] relative overflow-hidden group">
            <MorphicImage 
              src={foodDeal?.imageUrl || ''} 
              alt={foodDeal?.name || 'Food Deal'}
              fallbackIcon="local_pizza"
              className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-35 transition-opacity duration-500" 
            />
            <div className="relative z-10 flex justify-between items-start">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-black flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-primary dark:text-white">local_pizza</span>
              </div>
              <span className="bg-primary dark:bg-white text-white dark:text-black text-[9px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase">
                {foodDeal?.discount || 'Special Deal'}
              </span>
            </div>
            <div className="relative z-10 mt-auto">
              <p className="text-xs text-secondary dark:text-[#a4a2a5] mb-1 font-medium">Campus Dining</p>
              <h4 className="font-bold text-lg text-primary dark:text-white">{foodDeal?.name || 'Artisan Sandwiches'}</h4>
              <p className="text-xs text-secondary dark:text-[#a4a2a5] mt-1 line-clamp-1">{foodDeal?.description || 'Browse student dining deals.'}</p>
            </div>
          </div>
        </Link>

        {/* Freelance & Student Services Highlight */}
        <Link href="/freelance">
          <div className="glass-panel rounded-24 p-6 hover:scale-[1.01] transition-transform duration-300 flex flex-col justify-between min-h-[220px] relative overflow-hidden group">
            <div className="relative z-10 flex justify-between items-start">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-black flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-primary dark:text-white">work</span>
              </div>
              <span className="bg-primary/5 dark:bg-white/5 border border-outline text-primary dark:text-white text-[9px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase">
                Gig Economy
              </span>
            </div>
            <div className="relative z-10 mt-auto">
              <p className="text-xs text-secondary dark:text-[#a4a2a5] mb-1 font-medium">Student Gigs</p>
              <h4 className="font-bold text-lg text-primary dark:text-white">{latestProject?.title || 'Freelancers Hub'}</h4>
              <p className="text-xs text-secondary dark:text-[#a4a2a5] mt-1 line-clamp-1">{latestProject?.description || 'Find student photographers, tutors, and devs.'}</p>
              
              <div className="flex items-center gap-2 mt-4 text-xs text-secondary dark:text-[#a4a2a5]">
                <div className="flex -space-x-2">
                  <MorphicImage className="w-8 h-8 rounded-full border-2 border-surface object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" fallbackIcon="person" alt="Avatar" />
                  <MorphicImage className="w-8 h-8 rounded-full border-2 border-surface object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" fallbackIcon="person" alt="Avatar" />
                </div>
                <span className="font-semibold text-primary dark:text-white ml-1">+12 peers hiring</span>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Campus Event Bento Section */}
      {latestEvent && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary dark:text-[#a4a2a5] mb-4">Upcoming Featured Event</h3>
          <Link href="/community">
            <div className="base-card rounded-24 overflow-hidden hover:scale-[1.01] transition-transform duration-300 group flex flex-col md:flex-row h-auto md:h-48">
              <div className="w-full md:w-48 h-48 md:h-full shrink-0 relative overflow-hidden">
                <MorphicImage 
                  src={latestEvent.imageUrl || ''} 
                  alt={latestEvent.title} 
                  fallbackIcon="event"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex flex-col justify-between flex-1 min-w-0">
                <div>
                  <span className="text-xs font-semibold text-primary dark:text-white bg-surface-container-low dark:bg-surface-container-high px-2.5 py-1 rounded-full">
                    {latestEvent.date}
                  </span>
                  <h4 className="font-bold text-lg text-primary dark:text-white mt-3 truncate">{latestEvent.title}</h4>
                  <p className="text-sm text-secondary dark:text-[#a4a2a5] mt-1 line-clamp-2">{latestEvent.description}</p>
                </div>
                <div className="text-xs text-secondary dark:text-[#a4a2a5] font-medium mt-4 md:mt-0 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">people</span>
                  <span>{latestEvent.membersCount} students joined</span>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}
    </div>
  );
}
