'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  setUserRole,
  adminUpdateOrderStatus,
  adminDeleteUser,
  adminResolveDispute,
  adminToggleUserSuspension,
} from '@/app/actions/admin';
import {
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
} from '@/app/actions/food';
import MorphicImage from '@/components/MorphicImage';

type Tab = 'overview' | 'disputes' | 'users' | 'orders' | 'food' | 'events';

interface AdminClientProps {
  currentUser: { id: string; name: string; role: string };
  users: any[];
  orders: any[];
  foodItems: any[];
  events: any[];
  groups: any[];
  disputes: any[];
  stats: {
    users: number;
    orders: number;
    foodItems: number;
    events: number;
    posts: number;
    pendingOrders: number;
    openDisputes: number;
  };
}

export default function AdminClient({
  currentUser,
  users,
  orders,
  foodItems,
  events,
  disputes = [],
  stats,
}: AdminClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Food form state
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [editingFood, setEditingFood] = useState<any>(null);
  const [foodForm, setFoodForm] = useState({
    name: '', description: '', price: '', category: '', hotelName: '', discount: '', imageUrl: '',
  });

  const tabs: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'disputes', label: 'Trust & Safety', icon: 'gavel', badge: stats.openDisputes },
    { id: 'users', label: 'Users', icon: 'people', badge: stats.users },
    { id: 'orders', label: 'Orders', icon: 'receipt_long', badge: stats.pendingOrders },
    { id: 'food', label: 'Food Menu', icon: 'local_pizza', badge: stats.foodItems },
    { id: 'events', label: 'Events', icon: 'event', badge: stats.events },
  ];

  const handleResolveDispute = async (disputeId: string, status: 'resolved' | 'dismissed' | 'account_suspended') => {
    if (status === 'account_suspended' && !confirm('Are you sure you want to resolve this dispute and SUSPEND the reported student account?')) {
      return;
    }
    setLoadingId(disputeId);
    await adminResolveDispute(disputeId, status);
    router.refresh();
    setLoadingId(null);
  };

  const handleToggleSuspension = async (userId: string, currentSuspension: boolean) => {
    const nextState = !currentSuspension;
    if (nextState) {
      const reason = prompt('Enter reason for account suspension:', 'Violation of platform trust & safety guidelines');
      if (reason === null) return;
      setLoadingId(userId);
      await adminToggleUserSuspension(userId, true, reason);
    } else {
      if (!confirm('Reinstate this user account?')) return;
      setLoadingId(userId);
      await adminToggleUserSuspension(userId, false);
    }
    router.refresh();
    setLoadingId(null);
  };

  const handleOrderStatus = async (orderId: string, status: string) => {
    setLoadingId(orderId);
    await adminUpdateOrderStatus(orderId, status);
    router.refresh();
    setLoadingId(null);
  };

  const handleUserRole = async (userId: string, role: string) => {
    if (!confirm(`Set this user's role to "${role}"?`)) return;
    setLoadingId(userId);
    await setUserRole(userId, role);
    router.refresh();
    setLoadingId(null);
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setLoadingId(userId);
    await adminDeleteUser(userId);
    router.refresh();
    setLoadingId(null);
  };

  const openFoodEdit = (item?: any) => {
    if (item) {
      setEditingFood(item);
      setFoodForm({
        name: item.name,
        description: item.description,
        price: String(item.price),
        category: item.category,
        hotelName: item.hotelName,
        discount: item.discount || '',
        imageUrl: item.imageUrl || '',
      });
    } else {
      setEditingFood(null);
      setFoodForm({ name: '', description: '', price: '', category: 'Noodles', hotelName: 'KC', discount: '', imageUrl: '' });
    }
    setShowFoodModal(true);
  };

  const handleFoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...foodForm, price: parseFloat(foodForm.price), discount: foodForm.discount || undefined, imageUrl: foodForm.imageUrl || undefined };
    if (editingFood) {
      await updateFoodItem(editingFood.id, data.name, data.description, data.price, data.category, data.discount, true, data.hotelName, data.imageUrl);
    } else {
      await createFoodItem(data.name, data.description, data.price, data.category, data.discount, data.hotelName, data.imageUrl);
    }
    setShowFoodModal(false);
    router.refresh();
  };

  const handleDeleteFood = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" from the menu?`)) return;
    await deleteFoodItem(id);
    router.refresh();
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    preparing: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    completed: 'bg-green-500/15 text-green-600 dark:text-green-400',
    cancelled: 'bg-red-500/15 text-red-500',
  };

  return (
    <div className="flex flex-col gap-6 pb-12 text-primary dark:text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary dark:text-white">Admin Panel</h1>
          <p className="text-sm text-secondary dark:text-[#a4a2a5]">Platform management & Trust Control — Nobody v1.0</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-[16px]">verified_user</span>
          Admin
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-primary dark:bg-white text-white dark:text-black shadow-sm'
                : 'text-secondary hover:bg-surface-container-low dark:hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-surface-container dark:bg-surface-container-high'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Overview Tab ─── */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Users', value: stats.users, icon: 'people', color: 'text-blue-500' },
              { label: 'Total Orders', value: stats.orders, icon: 'receipt_long', color: 'text-amber-500' },
              { label: 'Pending Orders', value: stats.pendingOrders, icon: 'pending', color: 'text-orange-500' },
              { label: 'Open Disputes', value: stats.openDisputes, icon: 'gavel', color: 'text-red-500' },
              { label: 'Food Items', value: stats.foodItems, icon: 'local_pizza', color: 'text-green-500' },
              { label: 'Events', value: stats.events, icon: 'event', color: 'text-purple-500' },
            ].map((stat) => (
              <div key={stat.label} className="base-card p-5 rounded-24 flex flex-col gap-3">
                <span className={`material-symbols-outlined text-[28px] ${stat.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {stat.icon}
                </span>
                <div>
                  <p className="text-2xl font-bold text-primary dark:text-white">{stat.value}</p>
                  <p className="text-xs text-secondary mt-0.5 font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel rounded-24 p-6">
            <h3 className="font-bold text-base text-primary dark:text-white mb-4">Trust & Safety Guidelines</h3>
            <ul className="space-y-2 text-sm text-secondary dark:text-[#a4a2a5]">
              <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">shield</span> Inspect open reports in <strong className="text-primary dark:text-white">Trust & Safety tab</strong> to resolve non-delivery or payment disputes</li>
              <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">block</span> Use <strong className="text-primary dark:text-white">Suspend Account</strong> on malicious users to block them from creating orders or accepting gigs</li>
              <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">lock</span> All peer deliveries now require a <strong className="text-primary dark:text-white">4-Digit Handshake PIN</strong> for drop-off completion</li>
            </ul>
          </div>
        </div>
      )}

      {/* ─── Disputes & Safety Tab ─── */}
      {activeTab === 'disputes' && (
        <div className="flex flex-col gap-4">
          {disputes.length === 0 ? (
            <div className="text-center py-16 text-secondary base-card rounded-24">
              <span className="material-symbols-outlined text-[48px] opacity-40 mb-2">verified_user</span>
              <p className="text-sm font-medium">No dispute reports filed. Campus community is safe!</p>
            </div>
          ) : (
            disputes.map((dispute) => (
              <div key={dispute.id} className="base-card rounded-24 p-6 flex flex-col gap-4 border border-outline">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        dispute.status === 'open'
                          ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                          : dispute.status === 'account_suspended'
                          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                          : 'bg-green-500/15 text-green-600 dark:text-green-400'
                      }`}>
                        ● {dispute.status.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono text-secondary">#{dispute.id.slice(0, 8)}</span>
                    </div>

                    <h4 className="font-bold text-base text-primary dark:text-white mt-1">
                      Reason: <span className="capitalize">{dispute.reason.replace('_', ' ')}</span>
                    </h4>
                    <p className="text-xs text-secondary mt-0.5">
                      Reported on {new Date(dispute.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-secondary font-medium block">Order ID</span>
                    <span className="font-mono text-primary dark:text-white font-bold">#{dispute.orderId.slice(0, 8)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs p-3 bg-surface-container-low dark:bg-surface-container-high rounded-xl">
                  <div>
                    <span className="text-secondary font-bold uppercase text-[10px] tracking-wider block">Reporter</span>
                    <p className="font-bold text-primary dark:text-white">{dispute.reporter?.name}</p>
                    <p className="text-secondary">{dispute.reporter?.email} · {dispute.reporter?.phoneNumber}</p>
                  </div>
                  <div>
                    <span className="text-secondary font-bold uppercase text-[10px] tracking-wider block">Reported User</span>
                    <p className="font-bold text-primary dark:text-white">{dispute.reportedUser?.name}</p>
                    <p className="text-secondary">{dispute.reportedUser?.email} · {dispute.reportedUser?.phoneNumber}</p>
                    {dispute.reportedUser?.isSuspended && (
                      <span className="inline-block mt-1 text-[9px] font-bold bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                        ⛔ Account Currently Suspended
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-surface-container-lowest dark:bg-[#18181b] rounded-xl text-xs">
                  <span className="text-secondary font-bold text-[10px] uppercase tracking-wider block mb-1">Details & Evidence</span>
                  <p className="text-primary dark:text-white leading-relaxed">{dispute.details}</p>
                </div>

                {/* Dispute Actions */}
                <div className="flex gap-2 flex-wrap items-center justify-end border-t border-outline pt-3">
                  <button
                    onClick={() => handleResolveDispute(dispute.id, 'dismissed')}
                    disabled={loadingId === dispute.id}
                    className="px-4 py-2 rounded-full bg-surface-container-high font-bold text-xs hover:opacity-80 transition-all cursor-pointer"
                  >
                    Dismiss Report
                  </button>
                  <button
                    onClick={() => handleResolveDispute(dispute.id, 'resolved')}
                    disabled={loadingId === dispute.id}
                    className="px-4 py-2 rounded-full bg-green-600 text-white font-bold text-xs hover:bg-green-700 transition-all cursor-pointer"
                  >
                    Mark Resolved ✓
                  </button>
                  <button
                    onClick={() => handleResolveDispute(dispute.id, 'account_suspended')}
                    disabled={loadingId === dispute.id}
                    className="px-4 py-2 rounded-full bg-red-600 text-white font-bold text-xs hover:bg-red-700 shadow-md transition-all cursor-pointer"
                  >
                    Suspend Reported User ⛔
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Users Tab ─── */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-4">
          {users.map((u) => (
            <div key={u.id} className="base-card rounded-24 p-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 min-w-[240px] flex-1">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-outline">
                  <MorphicImage src={u.avatarUrl || ''} alt={u.name} fallbackIcon="account_circle" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-sm text-primary dark:text-white truncate">{u.name}</p>
                    <span className="text-[10px] font-bold bg-green-500/15 text-green-600 dark:text-green-400 px-1.5 py-0.2 rounded">✓ Verified Student</span>
                    {u.isSuspended && (
                      <span className="text-[10px] font-bold bg-red-500/20 text-red-600 dark:text-red-400 px-1.5 py-0.2 rounded">⛔ Suspended</span>
                    )}
                  </div>
                  <p className="text-xs text-secondary truncate">{u.email} · {u.phoneNumber}</p>
                  <div className="flex gap-1 flex-wrap mt-1">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-primary dark:bg-white text-white dark:text-black' : 'bg-surface-container dark:bg-surface-container-high text-secondary'}`}>
                      {u.role}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      Deliverer Rating: {(u.delivererRating || 5.0).toFixed(1)}★ ({u.delivererRatingCount || 0})
                    </span>
                  </div>
                </div>
              </div>

              {u.id !== currentUser.id && (
                <div className="flex gap-2 shrink-0 items-center">
                  <button
                    onClick={() => handleToggleSuspension(u.id, !!u.isSuspended)}
                    disabled={loadingId === u.id}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      u.isSuspended ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/30'
                    }`}
                  >
                    {u.isSuspended ? 'Reinstate Account' : 'Suspend'}
                  </button>
                  <button
                    onClick={() => handleUserRole(u.id, u.role === 'admin' ? 'student' : 'admin')}
                    disabled={loadingId === u.id}
                    className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-container-low dark:bg-surface-container-high text-primary dark:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                  >
                    {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id, u.name)}
                    disabled={loadingId === u.id}
                    className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-error/10 text-error hover:bg-error/20 transition-all cursor-pointer disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Orders Tab ─── */}
      {activeTab === 'orders' && (
        <div className="flex flex-col gap-4">
          {orders.length === 0 ? (
            <div className="text-center py-16 text-secondary">
              <span className="material-symbols-outlined text-[48px] opacity-40 mb-2">receipt_long</span>
              <p className="text-sm font-medium">No orders placed yet.</p>
            </div>
          ) : (
            orders.map((order) => {
              let parsedItems: any[] = [];
              try { parsedItems = JSON.parse(order.items); } catch {}
              return (
                <div key={order.id} className="base-card rounded-24 p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm text-primary dark:text-white">{order.user.name}</p>
                      <p className="text-xs text-secondary">{order.user.phoneNumber} · {new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${statusColors[order.status] || 'bg-surface-container text-secondary'}`}>
                        {order.status}
                      </span>
                      <span className="font-bold text-sm text-primary dark:text-white">₹{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-secondary flex flex-wrap gap-2">
                    {parsedItems.map((item: any, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-surface-container-low dark:bg-surface-container-high rounded-full">
                        {item.name} ×{item.quantity}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap border-t border-outline pt-3">
                    {['pending', 'preparing', 'completed', 'cancelled'].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleOrderStatus(order.id, s)}
                        disabled={order.status === s || loadingId === order.id}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-30 disabled:cursor-default ${
                          order.status === s ? 'bg-primary dark:bg-white text-white dark:text-black' : 'bg-surface-container-low dark:bg-surface-container-high text-secondary hover:text-primary dark:hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── Food Menu Tab ─── */}
      {activeTab === 'food' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button
              onClick={() => openFoodEdit()}
              className="px-5 py-2.5 rounded-full bg-primary dark:bg-white text-white dark:text-black font-semibold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              Add Food Item
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {foodItems.map((item) => (
              <div key={item.id} className="base-card rounded-24 p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-surface-container-low dark:bg-surface-container-high">
                  <MorphicImage src={item.imageUrl || ''} alt={item.name} fallbackIcon="local_pizza" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-primary dark:text-white truncate">{item.name}</p>
                  <p className="text-xs text-secondary">{item.hotelName} · {item.category}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-sm font-bold text-primary dark:text-white">₹{item.price}</span>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      {(item.rating || 4.5).toFixed(1)} ({item.reviewCount || 0})
                    </span>
                    {item.discount && <span className="text-[9px] font-bold bg-primary dark:bg-white text-white dark:text-black px-1.5 py-0.5 rounded-full">{item.discount}</span>}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${item.isAvailable ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => openFoodEdit(item)}
                    className="p-1.5 rounded-lg bg-surface-container-low dark:bg-surface-container-high text-secondary hover:text-primary dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteFood(item.id, item.name)}
                    className="p-1.5 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Events Tab ─── */}
      {activeTab === 'events' && (
        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <div key={event.id} className="base-card rounded-24 p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-surface-container-low dark:bg-surface-container-high">
                <MorphicImage src={event.imageUrl || ''} alt={event.title} fallbackIcon="event" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-primary dark:text-white truncate">{event.title}</p>
                <p className="text-xs text-secondary">{event.date} · {event.membersCount} attending</p>
                {event.group && <p className="text-xs text-secondary">Host: {event.group.name}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Food Item Modal */}
      {showFoodModal && (
        <>
          <div onClick={() => setShowFoodModal(false)} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-[#0d0d0f] border border-outline rounded-24 p-6 z-50 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-outline pb-3">
              <h2 className="font-bold text-lg text-primary dark:text-white">{editingFood ? 'Edit Food Item' : 'Add Food Item'}</h2>
              <button onClick={() => setShowFoodModal(false)} className="text-secondary cursor-pointer hover:text-primary dark:hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleFoodSubmit} className="flex flex-col gap-4">
              {[
                { key: 'name', label: 'Item Name', placeholder: 'e.g. Chicken Biryani', type: 'text' },
                { key: 'description', label: 'Description', placeholder: 'e.g. Fragrant basmati rice...', type: 'text' },
                { key: 'price', label: 'Price (₹)', placeholder: '80', type: 'number' },
                { key: 'category', label: 'Category', placeholder: 'e.g. Briyani', type: 'text' },
                { key: 'hotelName', label: 'Hotel/Counter', placeholder: 'KC or Campus Dining', type: 'text' },
                { key: 'discount', label: 'Discount Tag (optional)', placeholder: '20% off', type: 'text' },
                { key: 'imageUrl', label: 'Image URL (optional)', placeholder: 'https://...', type: 'text' },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={foodForm[key as keyof typeof foodForm]}
                    onChange={(e) => setFoodForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                  />
                </div>
              ))}
              <button
                type="submit"
                className="w-full py-3.5 mt-1 rounded-full bg-primary dark:bg-white text-white dark:text-black font-semibold text-sm hover:opacity-90 transition-all cursor-pointer"
              >
                {editingFood ? 'Save Changes' : 'Add to Menu'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
