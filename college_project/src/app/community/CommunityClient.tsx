'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import MorphicImage from '@/components/MorphicImage';
import { ToastContainer, useToast } from '@/components/Toast';
import {
  joinGroup,
  rsvpEvent,
  createCommunityGroup,
  createEvent,
} from '@/app/actions/community';

interface Group {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  imageUrl: string | null;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  membersCount: number;
  imageUrl: string | null;
  group: { id: string; name: string } | null;
}

interface CommunityClientProps {
  groups: Group[];
  events: Event[];
  userId?: string;
}

type Tab = 'events' | 'clubs';

export default function CommunityClient({ groups, events, userId }: CommunityClientProps) {
  const router = useRouter();
  const { toasts, addToast, dismissToast } = useToast();
  const [, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<Tab>('events');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  // Local optimistic state — plain useState, no useOptimistic
  const [localGroups, setLocalGroups] = useState<Group[]>(groups);
  const [localEvents, setLocalEvents] = useState<Event[]>(events);

  // Track which items are loading to disable their buttons
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set());
  const [rsvpedEventIds, setRsvpedEventIds] = useState<Set<string>>(new Set());

  // Group form state
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupLoading, setGroupLoading] = useState(false);

  // Event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventGroupId, setEventGroupId] = useState('');
  const [eventLoading, setEventLoading] = useState(false);

  const handleJoinGroup = async (groupId: string) => {
    if (!userId) {
      addToast('Please sign in to join a club.', 'error');
      return;
    }
    if (joinedGroupIds.has(groupId)) return;

    // Optimistic update
    setJoinedGroupIds((prev) => new Set(prev).add(groupId));
    setLocalGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, membersCount: g.membersCount + 1 } : g))
    );

    const res = await joinGroup(groupId);
    if (res.success) {
      addToast('Welcome to the club.', 'success');
      startTransition(() => { router.refresh(); });
    } else {
      // Revert on failure
      setJoinedGroupIds((prev) => { const s = new Set(prev); s.delete(groupId); return s; });
      setLocalGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, membersCount: g.membersCount - 1 } : g))
      );
      addToast(res.error || 'Failed to join group.', 'error');
    }
  };

  const handleRSVP = async (eventId: string) => {
    if (!userId) {
      addToast('Please sign in to RSVP to events.', 'error');
      return;
    }
    if (rsvpedEventIds.has(eventId)) return;

    // Optimistic update
    setRsvpedEventIds((prev) => new Set(prev).add(eventId));
    setLocalEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, membersCount: e.membersCount + 1 } : e))
    );

    const res = await rsvpEvent(eventId);
    if (res.success) {
      addToast("You're registered for the event.", 'success');
      startTransition(() => { router.refresh(); });
    } else {
      // Revert on failure
      setRsvpedEventIds((prev) => { const s = new Set(prev); s.delete(eventId); return s; });
      setLocalEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, membersCount: e.membersCount - 1 } : e))
      );
      addToast(res.error || 'Failed to RSVP.', 'error');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !groupDesc.trim()) {
      addToast('Please fill in all fields.', 'error');
      return;
    }
    setGroupLoading(true);
    const res = await createCommunityGroup(groupName, groupDesc);
    setGroupLoading(false);
    if (res.success) {
      addToast('Club created successfully.', 'success');
      setShowCreateGroup(false);
      setGroupName('');
      setGroupDesc('');
      startTransition(() => { router.refresh(); });
    } else {
      addToast(res.error || 'Failed to create club.', 'error');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDesc.trim() || !eventDate.trim()) {
      addToast('Please fill in all required fields.', 'error');
      return;
    }
    setEventLoading(true);
    const res = await createEvent(
      eventTitle,
      eventDesc,
      eventDate,
      eventGroupId || undefined
    );
    setEventLoading(false);
    if (res.success) {
      addToast('Event created.', 'success');
      setShowCreateEvent(false);
      setEventTitle('');
      setEventDesc('');
      setEventDate('');
      setEventGroupId('');
      startTransition(() => { router.refresh(); });
    } else {
      addToast(res.error || 'Failed to create event.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary dark:text-white">
            Community & Groups
          </h1>
          <p className="text-sm text-secondary dark:text-[#a4a2a5] mt-1">
            Join student organizations and discover campus events.
          </p>
        </div>
        {userId && (
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowCreateEvent(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-surface-container-low dark:bg-surface-container-high text-primary dark:text-white text-xs font-semibold hover:scale-105 active:scale-95 transition-all cursor-pointer border border-outline"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Host Event
            </button>
            <button
              type="button"
              onClick={() => setShowCreateGroup(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-primary dark:bg-white text-white dark:text-black text-xs font-semibold hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              New Club
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container-low dark:bg-surface-container rounded-full p-1 w-fit border border-outline">
        {([['events', 'event', 'Events'], ['clubs', 'groups', 'Clubs & Orgs']] as const).map(
          ([tab, icon, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-primary dark:bg-white text-white dark:text-black shadow-sm'
                  : 'text-secondary hover:text-primary dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{icon}</span>
              {label}
            </button>
          )
        )}
      </div>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <section className="flex flex-col gap-5">
          {localEvents.length === 0 ? (
            <div className="text-center py-16 text-secondary">
              <span className="material-symbols-outlined text-[48px] opacity-40 block mb-2">event_busy</span>
              <p className="text-sm font-medium">No events scheduled yet.</p>
              {userId && (
                <button
                  type="button"
                  onClick={() => setShowCreateEvent(true)}
                  className="mt-4 px-5 py-2.5 rounded-full bg-primary dark:bg-white text-white dark:text-black text-xs font-semibold cursor-pointer hover:scale-105 transition-all"
                >
                  Host the First Event
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {localEvents.map((event) => (
                <div
                  key={event.id}
                  className="base-card rounded-24 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow duration-300"
                >
                  <div className="w-full md:w-56 h-44 md:h-auto shrink-0 relative bg-surface-container-low">
                    <MorphicImage
                      src={event.imageUrl || ''}
                      fallbackIcon="event"
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-6 flex flex-col justify-between flex-1 gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold bg-primary dark:bg-white text-white dark:text-black px-2.5 py-0.5 rounded-full">
                          {event.date}
                        </span>
                        {event.group && (
                          <span className="text-[11px] text-secondary font-medium">
                            by {event.group.name}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-primary dark:text-white mt-1">
                        {event.title}
                      </h3>
                      <p className="text-xs text-secondary dark:text-[#a4a2a5] leading-relaxed line-clamp-2">
                        {event.description}
                      </p>
                    </div>

                    <div className="flex justify-between items-center border-t border-outline pt-4">
                      <span className="text-xs text-secondary font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">people</span>
                        {event.membersCount} attending
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRSVP(event.id)}
                        disabled={rsvpedEventIds.has(event.id)}
                        className="px-5 py-2 rounded-full bg-primary dark:bg-white text-white dark:text-black text-xs font-semibold hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {rsvpedEventIds.has(event.id) ? 'RSVPed' : 'RSVP'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Clubs Tab */}
      {activeTab === 'clubs' && (
        <section className="flex flex-col gap-5">
          {localGroups.length === 0 ? (
            <div className="text-center py-16 text-secondary">
              <span className="material-symbols-outlined text-[48px] opacity-40 block mb-2">group_off</span>
              <p className="text-sm font-medium">No clubs yet.</p>
              {userId && (
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(true)}
                  className="mt-4 px-5 py-2.5 rounded-full bg-primary dark:bg-white text-white dark:text-black text-xs font-semibold cursor-pointer hover:scale-105 transition-all"
                >
                  Start the First Club
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {localGroups.map((group) => (
                <div
                  key={group.id}
                  className="base-card rounded-24 p-6 flex flex-col justify-between gap-5 hover:scale-[1.01] transition-transform duration-300"
                >
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-outline bg-surface-container-low">
                      <MorphicImage
                        src={group.imageUrl || ''}
                        fallbackIcon="groups"
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-primary dark:text-white truncate">
                        {group.name}
                      </h3>
                      <span className="text-[11px] text-secondary font-medium mt-1 block">
                        {group.membersCount} members
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-secondary dark:text-[#a4a2a5] leading-relaxed line-clamp-3">
                    {group.description}
                  </p>

                  <div className="flex justify-end border-t border-outline pt-4">
                    <button
                      type="button"
                      onClick={() => handleJoinGroup(group.id)}
                      disabled={joinedGroupIds.has(group.id)}
                      className="px-5 py-2 rounded-full bg-surface-container-low dark:bg-surface-container-high text-primary dark:text-white text-xs font-semibold hover:scale-105 active:scale-95 transition-all cursor-pointer border border-outline disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {joinedGroupIds.has(group.id) ? 'Joined' : 'Join Club'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <>
          <div
            onClick={() => setShowCreateGroup(false)}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-[#0d0d0f] border border-outline rounded-24 p-6 z-50 shadow-2xl flex flex-col gap-6 animate-scale-up mx-4">
            <div className="flex justify-between items-center pb-3 border-b border-outline">
              <h2 className="font-bold text-lg text-primary dark:text-white">Start a New Club</h2>
              <button
                type="button"
                onClick={() => setShowCreateGroup(false)}
                className="text-secondary cursor-pointer hover:text-primary dark:hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  Club Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Photography Club"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  Description
                </label>
                <textarea
                  placeholder="What does your club do? Who can join?"
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={groupLoading}
                className="w-full py-3.5 rounded-full bg-primary dark:bg-white text-white dark:text-black font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer text-sm"
              >
                {groupLoading ? 'Creating...' : 'Create Club'}
              </button>
            </form>
          </div>
        </>
      )}

      {/* Create Event Modal */}
      {showCreateEvent && (
        <>
          <div
            onClick={() => setShowCreateEvent(false)}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-[#0d0d0f] border border-outline rounded-24 p-6 z-50 shadow-2xl flex flex-col gap-6 animate-scale-up mx-4">
            <div className="flex justify-between items-center pb-3 border-b border-outline">
              <h2 className="font-bold text-lg text-primary dark:text-white">Host a Campus Event</h2>
              <button
                type="button"
                onClick={() => setShowCreateEvent(false)}
                className="text-secondary cursor-pointer hover:text-primary dark:hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  Event Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Annual Tech Fest 2026"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  Date
                </label>
                <input
                  type="text"
                  placeholder="e.g. July 28, 2026 · 10:00 AM"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  Description
                </label>
                <textarea
                  placeholder="Describe the event details, venue, and what to expect..."
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none resize-none"
                />
              </div>

              {localGroups.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                    Hosted By (Club — Optional)
                  </label>
                  <select
                    value={eventGroupId}
                    onChange={(e) => setEventGroupId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none cursor-pointer"
                  >
                    <option value="">No specific club</option>
                    {localGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={eventLoading}
                className="w-full py-3.5 rounded-full bg-primary dark:bg-white text-white dark:text-black font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer text-sm"
              >
                {eventLoading ? 'Creating...' : 'Create Event'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
