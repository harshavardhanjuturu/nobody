'use client';

import React, { useState } from 'react';
import { createSkillPost } from '@/app/actions/skills';
import { toggleSectorRegistration } from '@/app/actions/profile';
import { useRouter } from 'next/navigation';
import { ToastContainer, useToast } from '@/components/Toast';

interface SkillPost {
  id: string;
  title: string;
  description: string;
  skillOffered: string;
  skillWanted: string;
  userName: string;
  userPhone: string;
  createdAt?: Date | string;
}

interface SkillsClientProps {
  posts: SkillPost[];
  defaultUserName: string;
  defaultUserPhone: string;
  isSkillExchanger: boolean;
}

const SKILL_TAGS = [
  'All', 'Programming', 'Design', 'Music', 'Languages', 'Math', 'Science', 'Art', 'Sports', 'Other',
];

export default function SkillsClient({ posts, defaultUserName, defaultUserPhone, isSkillExchanger }: SkillsClientProps) {
  const router = useRouter();
  const { toasts, addToast, dismissToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [contactPost, setContactPost] = useState<SkillPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [registered, setRegistered] = useState(isSkillExchanger);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillOffered, setSkillOffered] = useState('');
  const [skillWanted, setSkillWanted] = useState('');
  const [userName, setUserName] = useState(defaultUserName);
  const [userPhone, setUserPhone] = useState(defaultUserPhone);

  const handleRegister = async () => {
    setLoadingRegister(true);
    const res = await toggleSectorRegistration('skills');
    setLoadingRegister(false);
    if (res.success) {
      setRegistered(true);
      addToast("You're now registered as a Skill Exchanger.", 'success');
      router.refresh();
    } else {
      addToast(res.error || 'Failed to register.', 'error');
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.skillOffered.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.skillWanted.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.userName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag =
      activeTag === 'All' ||
      post.skillOffered.toLowerCase().includes(activeTag.toLowerCase()) ||
      post.skillWanted.toLowerCase().includes(activeTag.toLowerCase());

    return matchesSearch && matchesTag;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !skillOffered || !skillWanted || !userName || !userPhone) {
      addToast('Please fill out all fields.', 'error');
      return;
    }
    setLoading(true);
    const res = await createSkillPost(title, description, skillOffered, skillWanted, userName, userPhone);
    setLoading(false);
    if (res.success) {
      addToast('Skill swap posted.', 'success');
      setShowModal(false);
      setTitle('');
      setDescription('');
      setSkillOffered('');
      setSkillWanted('');
      router.refresh();
    } else {
      addToast(res.error || 'Failed to post skill swap.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Register Banner */}
      {!registered && (
        <div className="glass-panel p-5 rounded-24 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary dark:bg-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white dark:text-black text-[20px]">psychology</span>
            </div>
            <div>
              <p className="font-bold text-sm text-primary dark:text-white">Start Swapping Skills!</p>
              <p className="text-xs text-secondary mt-0.5 leading-relaxed">
                Register as a Skill Exchanger to trade languages, coding, or tutoring with peers.
              </p>
            </div>
          </div>
          <button
            onClick={handleRegister}
            disabled={loadingRegister}
            className="px-5 py-2.5 rounded-full bg-primary dark:bg-white text-white dark:text-black font-semibold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap disabled:opacity-60"
          >
            {loadingRegister ? 'Registering...' : 'Register Now'}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary dark:text-white">Skill Exchange</h1>
          <p className="text-sm text-secondary dark:text-[#a4a2a5] mt-1">
            Trade academic subjects, programming skills, or languages with student peers.
          </p>
        </div>
        <button
          onClick={() => {
            if (!registered) {
              addToast('Register as a Skill Exchanger first to post offers.', 'info');
              return;
            }
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary dark:bg-white text-white dark:text-black font-semibold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">add_circle</span>
          Offer Skill Swap
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 border-b border-outline pb-5">
        {/* Skill Category Tags */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {SKILL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap ${
                activeTag === tag
                  ? 'bg-primary dark:bg-white text-white dark:text-black'
                  : 'bg-surface-container-low dark:bg-surface-container-high text-secondary hover:text-primary dark:hover:text-white border border-outline'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[20px]">search</span>
          <input
            type="text"
            placeholder="Search skills (e.g. React, French, Guitar)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white placeholder-secondary/50 border border-transparent focus:border-outline outline-none transition-all"
          />
        </div>
      </div>

      <p className="text-xs text-secondary font-medium -mt-4">
        {filteredPosts.length} swap offer{filteredPosts.length !== 1 ? 's' : ''} found
      </p>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPosts.length === 0 ? (
          <div className="col-span-full text-center py-16 text-secondary">
            <span className="material-symbols-outlined text-[48px] opacity-40 block mb-2">psychology</span>
            <p className="text-sm font-medium">No skill swap offers match your search.</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveTag('All'); }}
              className="mt-3 text-xs text-primary dark:text-white underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="base-card rounded-24 p-6 flex flex-col justify-between gap-5 hover:shadow-md transition-all duration-300"
            >
              <div className="flex flex-col gap-3">
                <h3 className="font-bold text-base text-primary dark:text-white leading-snug">
                  {post.title}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 dark:text-green-400">
                      Offering
                    </span>
                    <p className="text-sm font-semibold text-primary dark:text-white mt-1 line-clamp-1">
                      {post.skillOffered}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                      Wanting
                    </span>
                    <p className="text-sm font-semibold text-primary dark:text-white mt-1 line-clamp-1">
                      {post.skillWanted}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-primary/80 dark:text-white/80 leading-relaxed line-clamp-2">
                {post.description}
              </p>

              <div className="flex justify-between items-center border-t border-outline pt-4">
                <span className="text-[11px] text-secondary font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">person</span>
                  {post.userName}
                </span>

                <button
                  onClick={() => setContactPost(post)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary dark:bg-white text-white dark:text-black text-xs font-semibold hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  Swap
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Contact Modal */}
      {contactPost && (
        <>
          <div onClick={() => setContactPost(null)} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-[#0d0d0f] border border-outline rounded-24 p-6 z-50 shadow-2xl flex flex-col gap-5 animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-outline">
              <h2 className="font-bold text-base text-primary dark:text-white">Initiate a Skill Swap</h2>
              <button onClick={() => setContactPost(null)} className="text-secondary hover:text-primary dark:hover:text-white cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <p className="text-[10px] font-bold uppercase text-green-700 dark:text-green-400 tracking-wider">They Offer</p>
                <p className="text-sm font-semibold text-primary dark:text-white mt-1">{contactPost.skillOffered}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <p className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-400 tracking-wider">They Want</p>
                <p className="text-sm font-semibold text-primary dark:text-white mt-1">{contactPost.skillWanted}</p>
              </div>
            </div>

            <div className="bg-surface-container-low dark:bg-surface-container-high rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary dark:bg-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white dark:text-black text-[20px]">person</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-primary dark:text-white">{contactPost.userName}</p>
                <p className="text-xs text-secondary">{contactPost.userPhone}</p>
              </div>
            </div>

            <a
              href={`tel:${contactPost.userPhone}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-primary dark:bg-white text-white dark:text-black font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
              Call to Arrange Swap
            </a>
          </div>
        </>
      )}

      {/* Post Skill Modal */}
      {showModal && (
        <>
          <div onClick={() => setShowModal(false)} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-[#0d0d0f] border border-outline rounded-24 p-6 z-50 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-outline">
              <h2 className="font-bold text-lg text-primary dark:text-white">Offer a Skill Swap</h2>
              <button onClick={() => setShowModal(false)} className="text-secondary cursor-pointer hover:text-primary dark:hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Listing Title</label>
                <input
                  type="text"
                  placeholder="e.g. Native French speaker offering language practice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Description</label>
                <textarea
                  placeholder="Describe your experience, how you'd like to structure the trade, and your availability..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Skill You Offer</label>
                  <input
                    type="text"
                    placeholder="e.g. French Conversation"
                    value={skillOffered}
                    onChange={(e) => setSkillOffered(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Skill You Want</label>
                  <input
                    type="text"
                    placeholder="e.g. Beginner Guitar"
                    value={skillWanted}
                    onChange={(e) => setSkillWanted(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Your Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Contact Number</label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 rounded-full bg-primary dark:bg-white text-white dark:text-black font-semibold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer text-sm"
              >
                {loading ? 'Posting Offer...' : 'Post Swap Offer'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
