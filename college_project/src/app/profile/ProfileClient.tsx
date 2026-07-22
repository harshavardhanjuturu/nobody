'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { updateProfile, toggleSectorRegistration } from '@/app/actions/profile';
import { useRouter } from 'next/navigation';
import MorphicImage from '@/components/MorphicImage';
import PushSubscriber from '@/components/PushSubscriber';

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

interface ProfileClientProps {
  initialUser: User;
  stats: {
    postsCount: number;
    ordersCount: number;
  };
}

export default function ProfileClient({ initialUser, stats }: ProfileClientProps) {
  const { logout, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialUser.name);
  const [email, setEmail] = useState(initialUser.email);
  const [avatarUrl, setAvatarUrl] = useState(initialUser.avatarUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sector states
  const [isFreelancer, setIsFreelancer] = useState(initialUser.isFreelancer);
  const [isSkillExchanger, setIsSkillExchanger] = useState(initialUser.isSkillExchanger);
  const [isFoodVendor, setIsFoodVendor] = useState(initialUser.isFoodVendor);

  const handleToggleSector = async (sector: 'freelancer' | 'skills' | 'food') => {
    try {
      const res = await toggleSectorRegistration(sector);
      if (res.success) {
        if (sector === 'freelancer') setIsFreelancer(prev => !prev);
        if (sector === 'skills') setIsSkillExchanger(prev => !prev);
        if (sector === 'food') setIsFoodVendor(prev => !prev);
        await refreshUser();
        router.refresh();
      } else {
        alert(res.error || 'Failed to toggle registration.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be under 5MB.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create Data URL locally for instant feedback
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        setAvatarUrl(dataUrl);

        // Instantly save to user profile
        const res = await updateProfile(name, email, dataUrl);
        if (res.success) {
          await refreshUser();
          router.refresh();
        } else {
          setError(res.error || 'Failed to save avatar.');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('File upload error:', err);
      setError('Error processing image upload.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await updateProfile(name, email, avatarUrl || undefined);
      if (res.success) {
        setIsEditing(false);
        await refreshUser();
        router.refresh();
      } else {
        setError(res.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-8 pb-12">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-primary dark:text-white">Student Settings</h1>
        <p className="text-sm text-secondary dark:text-[#a4a2a5]">Manage your campus profile, credentials, and app preferences.</p>
      </div>

      {/* User Header Bento */}
      <div className="glass-panel p-6 rounded-24 flex items-center gap-6">
        <div className="relative group w-20 h-20 shrink-0">
          <MorphicImage 
            src={avatarUrl || ''} 
            alt={initialUser.name} 
            fallbackIcon="account_circle"
            className="w-20 h-20 rounded-full overflow-hidden object-cover border border-outline shadow-md"
          />
          <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity duration-200 text-white text-[10px] font-bold">
            <span className="material-symbols-outlined text-[20px]">photo_camera</span>
            <span>Upload</span>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </label>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-primary dark:text-white truncate">{initialUser.name}</h2>
            {loading && <span className="material-symbols-outlined text-xs animate-spin text-[#004CBB]">hourglass_empty</span>}
          </div>
          <p className="text-xs text-secondary mt-1">{initialUser.email}</p>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="inline-block text-[9px] font-bold tracking-wider uppercase bg-[#004CBB] text-white px-2.5 py-0.5 rounded-full">
              {initialUser.role}
            </span>

            <label className="px-3 py-1 rounded-full bg-[#004CBB]/10 hover:bg-[#004CBB]/20 text-[#004CBB] dark:text-[#8078FF] text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-[#004CBB]/20">
              <span className="material-symbols-outlined text-[14px]">cloud_upload</span>
              <span>{loading ? 'Uploading...' : 'Change Photo'}</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="base-card p-5 rounded-24 text-center">
          <span className="text-[10px] font-bold tracking-wider uppercase text-secondary">Vibes Shared</span>
          <p className="text-2xl font-bold text-primary dark:text-white mt-1.5">{stats.postsCount}</p>
        </div>
        <div className="base-card p-5 rounded-24 text-center">
          <span className="text-[10px] font-bold tracking-wider uppercase text-secondary">Meals Ordered</span>
          <p className="text-2xl font-bold text-primary dark:text-white mt-1.5">{stats.ordersCount}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error/10 text-error text-sm font-medium border border-error/20">
          {error}
        </div>
      )}

      {/* Profile Form / Details */}
      <div className="base-card p-6 rounded-24 flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-outline pb-4">
          <h3 className="font-bold text-base text-primary dark:text-white">Profile Information</h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-semibold text-primary dark:text-white hover:opacity-80 cursor-pointer"
            >
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setName(initialUser.name);
                  setEmail(initialUser.email);
                }}
                className="px-5 py-2 rounded-full bg-surface-container-low dark:bg-surface-container-high text-xs font-semibold text-primary dark:text-white cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-full bg-primary dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4 text-sm font-medium">
            <div className="flex justify-between items-center py-1">
              <span className="text-secondary">Phone Number</span>
              <span className="text-primary dark:text-white">{initialUser.phoneNumber}</span>
            </div>
            
            <div className="flex justify-between items-center py-1 border-t border-outline">
              <span className="text-secondary">Email ID</span>
              <span className="text-primary dark:text-white truncate max-w-[200px]">{initialUser.email}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-t border-outline">
              <span className="text-secondary">Student ID</span>
              <span className="text-primary dark:text-white font-mono uppercase">#{initialUser.id.slice(0, 8)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Sector Registrations Bento */}
      <div className="base-card p-6 rounded-24 flex flex-col gap-6">
        <h3 className="font-bold text-base text-primary dark:text-white border-b border-outline pb-4">
          Campus Professional Hubs
        </h3>

        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-center text-sm font-medium">
            <div>
              <p className="text-primary dark:text-white">Freelancer Status</p>
              <p className="text-xs text-secondary mt-0.5 font-normal">Register to list yourself, bid on student gigs, and earn on campus.</p>
            </div>
            
            <button
              onClick={() => handleToggleSector('freelancer')}
              className={`px-5 py-2 rounded-full text-xs font-semibold hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                isFreelancer 
                  ? 'bg-green-600 text-white dark:bg-green-500' 
                  : 'bg-surface-container-low dark:bg-surface-container-high text-primary dark:text-white'
              }`}
            >
              {isFreelancer ? 'Registered' : 'Register Now'}
            </button>
          </div>

          <div className="flex justify-between items-center text-sm font-medium border-t border-outline pt-4">
            <div>
              <p className="text-primary dark:text-white">Skill Exchanger Status</p>
              <p className="text-xs text-secondary mt-0.5 font-normal">Register to post skill swaps and peer tutoring offers.</p>
            </div>
            
            <button
              onClick={() => handleToggleSector('skills')}
              className={`px-5 py-2 rounded-full text-xs font-semibold hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                isSkillExchanger 
                  ? 'bg-green-600 text-white dark:bg-green-500' 
                  : 'bg-surface-container-low dark:bg-surface-container-high text-primary dark:text-white'
              }`}
            >
              {isSkillExchanger ? 'Registered' : 'Register Now'}
            </button>
          </div>

          <div className="flex justify-between items-center text-sm font-medium border-t border-outline pt-4">
            <div>
              <p className="text-primary dark:text-white">Food Vendor Status</p>
              <p className="text-xs text-secondary mt-0.5 font-normal">Register to publish food menus, recipes, or kitchen menus.</p>
            </div>
            
            <button
              onClick={() => handleToggleSector('food')}
              className={`px-5 py-2 rounded-full text-xs font-semibold hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                isFoodVendor 
                  ? 'bg-green-600 text-white dark:bg-green-500' 
                  : 'bg-surface-container-low dark:bg-surface-container-high text-primary dark:text-white'
              }`}
            >
              {isFoodVendor ? 'Registered' : 'Register Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="base-card p-6 rounded-24 flex flex-col gap-6">
        <h3 className="font-bold text-base text-primary dark:text-white border-b border-outline pb-4">
          Preferences
        </h3>

        <div className="flex justify-between items-center text-sm font-medium">
          <div>
            <p className="text-primary dark:text-white">Application Theme</p>
            <p className="text-xs text-secondary mt-0.5 font-normal">Switch between light and dark display modes.</p>
          </div>
          
          <button
            onClick={toggleTheme}
            className="px-5 py-2 rounded-full bg-surface-container-low dark:bg-surface-container-high text-primary dark:text-white text-xs font-semibold hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>

        <div className="border-t border-outline pt-4">
          <PushSubscriber />
        </div>
      </div>

      {/* Log Out */}
      <button
        onClick={handleSignOut}
        className="w-full py-4 rounded-full bg-error/10 text-error hover:bg-error/20 font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-[20px]">logout</span>
        <span>Sign Out Account</span>
      </button>
    </div>
  );
}
