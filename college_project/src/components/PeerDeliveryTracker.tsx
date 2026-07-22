'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import MorphicImage from '@/components/MorphicImage';
import DisputeModal from '@/components/DisputeModal';
import RatingModal from '@/components/RatingModal';
import { confirmOrderReceipt } from '@/app/actions/food';

interface Deliverer {
  id: string;
  name: string;
  phoneNumber: string;
  avatarUrl: string | null;
}

interface PeerDeliveryTrackerProps {
  gigId: string;
  orderId: string;
  deliveryAddress?: string | null;
  deliveryFee?: number;
}

export default function PeerDeliveryTracker({
  gigId,
  orderId,
  deliveryAddress,
  deliveryFee = 20,
}: PeerDeliveryTrackerProps) {
  const [status, setStatus] = useState<string>('open');
  const [deliveryCode, setDeliveryCode] = useState<string | null>(null);
  const [deliverer, setDeliverer] = useState<Deliverer | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/delivery/location?gigId=${gigId}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
        if (data.deliveryCode) setDeliveryCode(data.deliveryCode);
        if (data.deliverer) setDeliverer(data.deliverer);
        if (data.lat !== undefined) setLat(data.lat);
        if (data.lng !== undefined) setLng(data.lng);
        if (data.lastLocationAt) setLastUpdated(data.lastLocationAt);
      }
    } catch (e) {
      console.error('Tracker error:', e);
    } finally {
      setLoading(false);
    }
  }, [gigId]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 1500);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const steps = [
    { key: 'open', label: 'Searching Peer', icon: 'search' },
    { key: 'accepted', label: 'Accepted', icon: 'handshake' },
    { key: 'picked_up', label: 'Food Picked Up', icon: 'takeout_dining' },
    { key: 'delivered', label: 'Delivered', icon: 'task_alt' },
  ];

  const getStepIndex = (st: string) => {
    if (st === 'open') return 0;
    if (st === 'accepted') return 1;
    if (st === 'picked_up') return 2;
    if (st === 'delivered') return 3;
    return 0;
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className="base-card rounded-24 p-6 flex flex-col gap-5 bg-gradient-to-br from-surface-container-low via-surface-container-high/40 to-transparent border border-outline/20 shadow-md text-primary dark:text-white">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 pb-3 border-b border-outline">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary dark:text-white text-[20px]">two_wheeler</span>
            <h3 className="font-bold text-base text-primary dark:text-white">Live Peer Delivery Tracker</h3>
          </div>
          <p className="text-xs text-secondary mt-0.5">Drop-off: {deliveryAddress || 'Campus Location'} (Fee: ₹{deliveryFee})</p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            status === 'delivered'
              ? 'bg-[#004CBB]/10 text-[#004CBB] dark:text-[#8078FF]'
              : status === 'open'
              ? 'bg-[#8078FF]/15 text-[#004CBB] dark:text-[#8078FF] animate-pulse'
              : 'bg-[#004CBB]/15 text-[#004CBB] dark:text-[#8078FF]'
          }`}>
            {status === 'open' ? 'Searching Peer...' : status === 'accepted' ? 'Deliverer Assigned' : status === 'picked_up' ? 'En Route' : 'Delivered'}
          </span>

          {/* Dispute button */}
          {deliverer && (
            <button
              onClick={() => setShowDisputeModal(true)}
              className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">flag</span>
              <span>Report Issue</span>
            </button>
          )}
        </div>
      </div>

      {/* Handshake Security PIN Box for Customer */}
      {deliveryCode && (
        <div className="p-4 bg-[#004CBB]/10 border border-[#004CBB]/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-primary dark:text-white">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#004CBB] dark:text-[#8078FF] text-[24px]">verified_user</span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest block text-[#004CBB] dark:text-[#8078FF]">
                Handshake Verification PIN
              </span>
              <p className="text-xs text-secondary font-medium">
                Give this 4-digit code to your deliverer upon receiving your food.
              </p>
            </div>
          </div>
          <div className="px-4 py-2 bg-[#004CBB]/20 border border-[#004CBB]/40 rounded-xl font-mono text-2xl font-black tracking-widest text-[#004CBB] dark:text-[#8078FF] shrink-0">
            {deliveryCode}
          </div>
        </div>
      )}

      {/* Status Progress Pipeline */}
      <div className="relative flex justify-between items-center px-2 py-3">
        <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-outline/20 -translate-y-1/2 -z-0" />
        <div
          className="absolute top-1/2 left-8 h-0.5 bg-[#004CBB] dark:bg-[#8078FF] -translate-y-1/2 -z-0 transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 80}%` }}
        />

        {steps.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center gap-1.5 text-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isDone
                  ? 'bg-[#004CBB] text-white shadow'
                  : 'bg-surface-container-high text-secondary border border-outline'
              } ${isCurrent ? 'scale-110 ring-4 ring-[#004CBB]/20' : ''}`}>
                <span className="material-symbols-outlined text-[16px]">{step.icon}</span>
              </div>
              <span className={`text-[10px] font-semibold tracking-tight max-w-[70px] ${
                isDone ? 'text-[#004CBB] dark:text-[#8078FF]' : 'text-secondary opacity-60'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Deliverer Card & Controls */}
      {deliverer ? (
        <div className="p-4 bg-surface-container-low dark:bg-surface-container-high rounded-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden border border-outline shrink-0">
                <MorphicImage src={deliverer.avatarUrl || ''} alt={deliverer.name} fallbackIcon="account_circle" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-secondary uppercase font-bold tracking-wider">Student Deliverer</p>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#004CBB]/15 text-[#004CBB] dark:text-[#8078FF]">Verified</span>
                </div>
                <h4 className="font-bold text-sm text-primary dark:text-white">{deliverer.name}</h4>
              </div>
            </div>

            {/* Quick Action Buttons: Call & DM */}
            <div className="flex items-center gap-2">
              <a
                href={`tel:${deliverer.phoneNumber}`}
                className="w-9 h-9 rounded-full bg-[#004CBB]/10 text-[#004CBB] dark:text-[#8078FF] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                title={`Call ${deliverer.name}`}
              >
                <span className="material-symbols-outlined text-[18px]">call</span>
              </a>
              <Link
                href={`/messages/${deliverer.id}`}
                className="w-9 h-9 rounded-full bg-primary/10 dark:bg-white/10 text-primary dark:text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                title={`Message ${deliverer.name}`}
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
              </Link>
            </div>
          </div>

          {/* Live GPS Coordinates Info */}
          {lat !== null && lng !== null && (
            <div className="flex items-center justify-between pt-2 border-t border-outline text-[11px] text-secondary">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#004CBB] animate-ping inline-block" />
                GPS: {lat.toFixed(4)}, {lng.toFixed(4)}
              </span>
              <span>
                Updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-surface-container-low dark:bg-surface-container-high rounded-2xl flex items-center justify-between text-xs text-secondary">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined animate-spin text-[16px]">hourglass_empty</span>
            Broadcasting request to nearby campus student deliverers...
          </span>
        </div>
      )}

      {/* Buyer Order Confirmation Banner & Rating prompt when Delivered */}
      {status === 'delivered' && (
        <div className="p-4 bg-[#004CBB]/10 border border-[#004CBB]/30 rounded-2xl flex flex-col gap-3 items-center text-center">
          <div className="flex items-center gap-2 text-[#004CBB] dark:text-[#8078FF] font-bold text-sm">
            <span className="material-symbols-outlined text-[24px]">task_alt</span>
            <span>Food Delivered! Confirm & Rate</span>
          </div>
          <p className="text-xs text-secondary">
            Handshake PIN verified. Confirm receipt to complete order and rate your deliverer.
          </p>

          <div className="flex gap-2 flex-wrap justify-center">
            {deliverer && (
              <button
                onClick={() => setShowRatingModal(true)}
                className="px-4 py-2 rounded-full bg-surface-container-high font-bold text-xs hover:scale-105 transition-all cursor-pointer flex items-center gap-1 text-primary dark:text-white"
              >
                <span className="material-symbols-outlined text-[16px] text-[#8078FF]">star</span>
                <span>Rate Deliverer</span>
              </button>
            )}

            <button
              onClick={async () => {
                const res = await confirmOrderReceipt(orderId);
                if (res.success) {
                  window.location.reload();
                }
              }}
              className="px-6 py-2 rounded-full bg-[#004CBB] hover:bg-[#003da1] text-white font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Got My Food! Complete Order
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showDisputeModal && deliverer && (
        <DisputeModal
          orderId={orderId}
          gigId={gigId}
          reportedUserId={deliverer.id}
          reportedUserName={deliverer.name}
          onClose={() => setShowDisputeModal(false)}
        />
      )}

      {showRatingModal && deliverer && (
        <RatingModal
          gigId={gigId}
          toUserId={deliverer.id}
          toUserName={deliverer.name}
          feedbackType="buyer_to_deliverer"
          onClose={() => setShowRatingModal(false)}
        />
      )}
    </div>
  );
}
