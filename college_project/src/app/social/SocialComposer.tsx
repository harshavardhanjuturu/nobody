'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPost } from '@/app/actions/social';
import MorphicImage from '@/components/MorphicImage';

interface SocialComposerProps {
  userAvatarUrl: string | null;
  userName: string;
}

export default function SocialComposer({ userAvatarUrl, userName }: SocialComposerProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setImagePreview(data.url);
      } else {
        alert(data.error || 'Failed to upload image.');
      }
    } catch (e) {
      alert('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || posting) return;
    setPosting(true);
    try {
      const res = await createPost(content.trim(), imagePreview || undefined);
      if (res.success) {
        setContent('');
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        router.refresh();
      } else {
        alert(res.error || 'Failed to post.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-24 flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex gap-4 items-start">
        <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden">
          <MorphicImage
            src={userAvatarUrl || ''}
            alt={userName}
            fallbackIcon="account_circle"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            required
            className="w-full bg-transparent text-primary dark:text-white placeholder-secondary/50 border-none outline-none resize-none text-sm focus:ring-0"
          />

          {/* Image preview */}
          {imagePreview && (
            <div className="relative rounded-xl overflow-hidden max-h-48">
              <img src={imagePreview} alt="Post image" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-outline">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-secondary hover:text-primary dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1"
                title="Attach Image"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {uploading ? 'hourglass_empty' : 'image'}
                </span>
                {uploading && <span className="text-[10px]">Uploading...</span>}
              </button>
            </div>

            <button
              type="submit"
              disabled={!content.trim() || posting}
              className="px-6 py-2 rounded-full bg-primary dark:bg-white text-white dark:text-black font-semibold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
            >
              {posting ? 'Posting...' : 'Post Vibe'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
