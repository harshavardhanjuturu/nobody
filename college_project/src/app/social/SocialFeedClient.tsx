'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import MorphicImage from '@/components/MorphicImage';
import { ToastContainer, useToast } from '@/components/Toast';
import { createPost, likePost, deletePost } from '@/app/actions/social';

interface PostUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
}

interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  likes: number;
  userId: string;
  user: PostUser;
  createdAt: string;
}

interface CurrentUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
}

interface SocialFeedClientProps {
  initialPosts: Post[];
  currentUser: CurrentUser | null;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export default function SocialFeedClient({ initialPosts, currentUser }: SocialFeedClientProps) {
  const router = useRouter();
  const { toasts, addToast, dismissToast } = useToast();
  const [, startTransition] = useTransition();

  // Local state for posts — plain useState, no useOptimistic
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  // Track liked/deleted IDs to prevent double-clicks
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Composer state
  const [composerContent, setComposerContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLike = async (postId: string) => {
    if (likedIds.has(postId)) return;

    // Optimistic update
    setLikedIds((prev) => new Set(prev).add(postId));
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p))
    );

    const res = await likePost(postId);
    if (!res.success) {
      // Revert
      setLikedIds((prev) => { const s = new Set(prev); s.delete(postId); return s; });
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes: p.likes - 1 } : p))
      );
      addToast('Could not like post.', 'error');
    }
  };

  const handleDelete = async (postId: string) => {
    if (deletingIds.has(postId)) return;

    setDeletingIds((prev) => new Set(prev).add(postId));
    // Optimistic remove
    setPosts((prev) => prev.filter((p) => p.id !== postId));

    const res = await deletePost(postId);
    if (res.success) {
      addToast('Post deleted.', 'success');
      startTransition(() => { router.refresh(); });
    } else {
      addToast(res.error || 'Failed to delete post.', 'error');
      // No easy revert for delete — just refresh to get real state
      startTransition(() => { router.refresh(); });
    }
    setDeletingIds((prev) => { const s = new Set(prev); s.delete(postId); return s; });
  };

  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerContent.trim()) {
      addToast('Write something first!', 'info');
      return;
    }
    if (!currentUser) {
      addToast('Please sign in to post.', 'error');
      return;
    }

    setSubmitting(true);
    const res = await createPost(composerContent.trim(), imageUrl.trim() || undefined);
    setSubmitting(false);

    if (res.success) {
      addToast('Posted successfully.', 'success');
      setComposerContent('');
      setImageUrl('');
      setShowImageInput(false);
      startTransition(() => { router.refresh(); });
    } else {
      addToast(res.error || 'Failed to post.', 'error');
    }
  };

  const charCount = composerContent.length;
  const charMax = 500;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 pb-12">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary dark:text-white">
          Campus Social
        </h1>
        <p className="text-sm text-secondary dark:text-[#a4a2a5] mt-1">
          Share updates, ask questions, or vibe with fellow peers.
        </p>
      </div>

      {/* Composer */}
      {currentUser ? (
        <form
          onSubmit={handleCompose}
          className="base-card rounded-24 p-5 flex flex-col gap-4"
        >
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
              <MorphicImage
                src={currentUser.avatarUrl || ''}
                alt={currentUser.name}
                fallbackIcon="account_circle"
                className="w-full h-full object-cover"
              />
            </div>
            <textarea
              value={composerContent}
              onChange={(e) => setComposerContent(e.target.value)}
              placeholder={`What's on your mind, ${currentUser.name.split(' ')[0]}?`}
              rows={3}
              maxLength={charMax}
              className="flex-1 bg-surface-container-low dark:bg-surface-container-high rounded-2xl px-4 py-3 text-sm text-primary dark:text-white placeholder-secondary/60 resize-none outline-none border border-transparent focus:border-outline transition-all"
            />
          </div>

          {showImageInput && (
            <input
              type="url"
              placeholder="Paste an image URL..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
            />
          )}

          <div className="flex items-center justify-between gap-3 pt-1 border-t border-outline">
            <button
              type="button"
              onClick={() => setShowImageInput((v) => !v)}
              className={`p-2 rounded-full text-secondary hover:text-primary dark:hover:text-white transition-colors cursor-pointer ${
                showImageInput ? 'text-primary dark:text-white bg-surface-container-low dark:bg-surface-container' : ''
              }`}
              title="Add image URL"
            >
              <span className="material-symbols-outlined text-[20px]">image</span>
            </button>

            <div className="flex items-center gap-3">
              <span
                className={`text-[11px] font-medium tabular-nums ${
                  charCount > charMax * 0.9 ? 'text-red-500' : 'text-secondary'
                }`}
              >
                {charCount}/{charMax}
              </span>
              <button
                type="submit"
                disabled={submitting || !composerContent.trim()}
                className="px-5 py-2 rounded-full bg-primary dark:bg-white text-white dark:text-black text-xs font-semibold hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="base-card rounded-24 p-5 text-center text-sm text-secondary">
          Sign in to post to the campus feed.
        </div>
      )}

      {/* Feed */}
      <div className="flex flex-col gap-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-secondary">
            <span className="material-symbols-outlined text-[48px] mb-2 opacity-40 block">
              chat_bubble_outline
            </span>
            <p className="text-sm font-medium">No posts yet. Be the first!</p>
          </div>
        ) : (
          posts.map((post) => {
            const isOwner = currentUser?.id === post.userId;
            const isAdmin = currentUser?.role === 'admin';

            return (
              <div
                key={post.id}
                className="base-card p-5 rounded-24 flex gap-4 transition-all hover:shadow-sm"
              >
                <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden">
                  <MorphicImage
                    src={post.user.avatarUrl || ''}
                    alt={post.user.name}
                    fallbackIcon="account_circle"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-primary dark:text-white">
                        {post.user.name}
                      </span>
                      {post.user.role === 'admin' && (
                        <span className="text-[9px] font-bold bg-primary dark:bg-white text-white dark:text-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] text-secondary dark:text-[#a4a2a5] whitespace-nowrap">
                        {timeAgo(post.createdAt)}
                      </span>
                      {(isOwner || isAdmin) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(post.id)}
                          disabled={deletingIds.has(post.id)}
                          className="p-1 rounded-full text-secondary hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete post"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-primary/95 dark:text-white/95 leading-relaxed whitespace-pre-wrap break-words">
                    {post.content}
                  </p>

                  {post.imageUrl && (
                    <div className="rounded-xl overflow-hidden mt-1 max-h-72 bg-surface-container-low">
                      <img
                        src={post.imageUrl}
                        alt="Post attachment"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="flex gap-4 mt-1.5">
                    <button
                      type="button"
                      onClick={() => handleLike(post.id)}
                      disabled={likedIds.has(post.id)}
                      className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary dark:hover:text-white transition-colors cursor-pointer group disabled:opacity-60"
                    >
                      <span
                        className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform"
                        style={{
                          fontVariationSettings: likedIds.has(post.id) ? "'FILL' 1" : "'FILL' 0",
                        }}
                      >
                        favorite
                      </span>
                      <span className="font-semibold">{post.likes}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
