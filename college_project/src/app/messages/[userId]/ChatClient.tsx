'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import MorphicImage from '@/components/MorphicImage';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  fromUserId: string;
  from: { id: string; name: string; avatarUrl: string | null };
}

interface ChatClientProps {
  currentUser: { id: string; name: string; avatarUrl: string | null };
  recipient: { id: string; name: string; avatarUrl: string | null; phoneNumber: string };
}

const POLL_INTERVAL = 3000; // 3 seconds

export default function ChatClient({ currentUser, recipient }: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?with=${recipient.id}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.error('Poll error:', e);
    } finally {
      setLoading(false);
    }
  }, [recipient.id]);

  // Initial load + polling every 3s
  useEffect(() => {
    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);

    // Optimistic update
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      content: input.trim(),
      createdAt: new Date().toISOString(),
      fromUserId: currentUser.id,
      from: { id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl },
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: recipient.id, content: optimistic.content }),
      });
      // Next poll will replace the optimistic message with the real one
      await fetchMessages();
    } catch (e) {
      console.error('Send error:', e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-160px)] pb-4">
      {/* Chat Header */}
      <div className="flex items-center gap-3 pb-4 mb-2 border-b border-outline">
        <Link href="/messages" className="text-secondary hover:text-primary dark:hover:text-white transition-colors">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>
        <div className="w-10 h-10 rounded-full overflow-hidden border border-outline shrink-0">
          <MorphicImage src={recipient.avatarUrl || ''} alt={recipient.name} fallbackIcon="account_circle" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-primary dark:text-white">{recipient.name}</p>
          <p className="text-xs text-secondary">{recipient.phoneNumber}</p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
          Live
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 py-2 pr-1">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-outline border-t-primary dark:border-t-white animate-spin" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-center py-10 text-secondary">
            <span className="material-symbols-outlined text-[40px] opacity-40 mb-2">waving_hand</span>
            <p className="text-sm font-medium">Say hi to {recipient.name}!</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMine = msg.fromUserId === currentUser.id;
          const showAvatar = !isMine && (idx === 0 || messages[idx - 1]?.fromUserId !== msg.fromUserId);
          return (
            <div
              key={msg.id}
              className={`flex gap-2 items-end ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {!isMine && (
                <div className={`w-7 h-7 rounded-full overflow-hidden shrink-0 border border-outline ${showAvatar ? 'visible' : 'invisible'}`}>
                  <MorphicImage src={msg.from.avatarUrl || ''} alt={msg.from.name} fallbackIcon="account_circle" className="w-full h-full object-cover" />
                </div>
              )}
              <div className={`max-w-[72%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMine
                      ? 'bg-primary dark:bg-white text-white dark:text-black rounded-br-sm'
                      : 'bg-surface-container dark:bg-surface-container-high text-primary dark:text-white rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-secondary px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Message input */}
      <form onSubmit={sendMessage} className="flex gap-3 pt-3 border-t border-outline">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message ${recipient.name}...`}
          className="flex-1 px-4 py-3 rounded-full bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white placeholder-secondary/50 border border-transparent focus:border-outline outline-none transition-all"
          autoFocus
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="w-11 h-11 rounded-full bg-primary dark:bg-white text-white dark:text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      </form>
    </div>
  );
}
