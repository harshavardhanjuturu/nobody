'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import MorphicImage from '@/components/MorphicImage';

export function TopAppBar({ onToggleMenu }: { onToggleMenu: () => void }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 dark:bg-[#0a0a0c]/95 backdrop-blur-[20px] border-b border-slate-200 dark:border-[#2a2a2e] shadow-xs transition-all text-slate-900 dark:text-white">
      <div className="flex justify-between items-center px-6 py-4 w-full max-w-7xl mx-auto">
        <button 
          onClick={onToggleMenu}
          className="text-slate-800 dark:text-white hover:opacity-80 transition-opacity active:scale-95 duration-200 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>
        
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">Nobody</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="text-slate-800 dark:text-white hover:opacity-80 transition-opacity active:scale-95 duration-200 cursor-pointer"
            title="Toggle theme"
          >
            <span className="material-symbols-outlined text-[24px]">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
          
          <Link href="/profile" className="flex items-center">
            <MorphicImage 
              src={user?.avatarUrl || ''} 
              alt={user?.name || 'User'} 
              fallbackIcon="account_circle"
              className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 object-cover hover:scale-105 transition-transform"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function BottomNavBar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: 'home', label: 'Home' },
    { href: '/social', icon: 'forum', label: 'Social' },
    { href: '/food', icon: 'local_pizza', label: 'Food' },
    { href: '/community', icon: 'groups', label: 'Groups' },
    { href: '/profile', icon: 'person', label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md rounded-2xl bg-white/90 dark:bg-[#121214]/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl flex justify-around items-center py-2 px-2 z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.href} 
            href={item.href}
            title={item.label}
            className={`relative flex flex-col items-center justify-center rounded-xl px-3 py-1.5 transition-all duration-200 cursor-pointer ${
              isActive 
                ? 'bg-[#004CBB] text-white shadow-md font-bold scale-105' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 font-medium'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="text-[10px] font-semibold tracking-tight leading-tight mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarDrawer({ isOpen, onClose, userRole }: { isOpen: boolean; onClose: () => void; userRole?: string }) {
  const { logout } = useAuth();
  const router = useRouter();

  const menuItems = [
    { href: '/', icon: 'home', label: 'Dashboard' },
    { href: '/social', icon: 'forum', label: 'Campus Social' },
    { href: '/food', icon: 'local_pizza', label: 'Food & Dining' },
    { href: '/community', icon: 'groups', label: 'Student Groups & Events' },
    { href: '/marketplace', icon: 'shopping_bag', label: 'Marketplace' },
    { href: '/freelance', icon: 'work', label: 'Freelance Hub' },
    { href: '/skills', icon: 'psychology', label: 'Skill Exchange' },
    { href: '/messages', icon: 'chat', label: 'Messages' },
    { href: '/id', icon: 'badge', label: 'Student ID' },
    { href: '/profile', icon: 'person', label: 'My Profile' },
    ...(userRole === 'admin' ? [{ href: '/admin', icon: 'admin_panel_settings', label: 'Admin Panel' }] : []),
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity"
        />
      )}
      
      {/* Drawer */}
      <div className={`fixed top-0 left-0 bottom-0 z-[70] w-80 max-w-[85vw] bg-white dark:bg-[#0a0a0c] text-slate-900 dark:text-white border-r border-slate-200 dark:border-[#2a2a2e] transition-transform duration-300 ease-out transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full p-6 pb-28 overflow-y-auto hide-scrollbar">
          <div className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-[#2a2a2e] mb-6 shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">Nobody</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-500 hover:text-slate-900 dark:text-[#a4a2a5] dark:hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <div className="flex-1 flex flex-col gap-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1f1f23] transition-colors text-slate-800 dark:text-white font-medium"
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
          
          <div className="pt-6 border-t border-slate-200 dark:border-[#2a2a2e] mt-6 shrink-0 pb-6">
            <button
              onClick={async () => {
                onClose();
                await logout();
                router.push('/login');
              }}
              className="flex items-center gap-4 px-4 py-3 w-full rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all font-medium cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isLoginPage = pathname === '/login';
  const isChatPage = pathname?.startsWith('/messages/');

  React.useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.push('/login');
    }
  }, [user, loading, isLoginPage, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#004CBB]/20 border-t-[#004CBB] animate-spin"></div>
          <p className="font-medium text-secondary">Loading Nobody Portal...</p>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background transition-colors duration-200">
      <TopAppBar onToggleMenu={() => setDrawerOpen(true)} />
      <SidebarDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} userRole={user?.role} />
      
      <main className={`flex-1 pt-[88px] pb-32 px-6 max-w-7xl mx-auto w-full transition-all ${isChatPage ? 'overflow-hidden' : ''}`}>
        {children}
        <div className="h-28 w-full shrink-0" aria-hidden="true" />
      </main>
      
      <BottomNavBar />
    </div>
  );
}
