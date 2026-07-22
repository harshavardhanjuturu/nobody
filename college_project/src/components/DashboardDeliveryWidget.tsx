'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import MorphicImage from '@/components/MorphicImage';
import PeerDeliveryTracker from '@/components/PeerDeliveryTracker';
import DisputeModal from '@/components/DisputeModal';
import RatingModal from '@/components/RatingModal';
import { getDashboardActiveData, acceptDeliveryGig, updateGigStatus, verifyDeliveryHandshakeCode } from '@/app/actions/delivery';
import { confirmOrderReceipt, cancelOrder } from '@/app/actions/food';

export default function DashboardDeliveryWidget() {
  const [loading, setLoading] = useState(true);
  const [myActiveOrders, setMyActiveOrders] = useState<any[]>([]);
  const [myAssignedGigs, setMyAssignedGigs] = useState<any[]>([]);
  const [openGigs, setOpenGigs] = useState<any[]>([]);
  const [dismissedGigIds, setDismissedGigIds] = useState<string[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Handshake PIN Modal / Prompt state for Deliverer
  const [pinModalGig, setPinModalGig] = useState<any | null>(null);
  const [inputPin, setInputPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Dispute & Rating modals
  const [disputeConfig, setDisputeConfig] = useState<{ orderId: string; gigId?: string; reportedUserId: string; reportedUserName: string } | null>(null);
  const [ratingConfig, setRatingConfig] = useState<{ gigId: string; toUserId: string; toUserName: string; feedbackType: 'buyer_to_deliverer' | 'deliverer_to_buyer' } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await getDashboardActiveData();
      if (res.success) {
        setMyActiveOrders(res.myActiveOrders || []);
        setMyAssignedGigs(res.myAssignedGigs || []);
        setOpenGigs(res.openGigs || []);
      }
    } catch (e) {
      console.warn('[DASHBOARD WIDGET] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handler for Deliverer accepting an open gig
  const handleAcceptGig = async (gigId: string) => {
    setActionLoadingId(gigId);
    try {
      const res = await acceptDeliveryGig(gigId);
      if (res.success) {
        await fetchData();
      } else {
        alert(res.error || 'Failed to accept delivery request.');
      }
    } catch (e: any) {
      alert(e.message || 'Error accepting gig');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handler for Deliverer marking Food Picked Up
  const handleMarkPickedUp = async (gigId: string) => {
    setActionLoadingId(gigId);
    try {
      const res = await updateGigStatus(gigId, 'picked_up');
      if (res.success) {
        await fetchData();
      } else {
        alert(res.error || 'Failed to update status.');
      }
    } catch (e: any) {
      alert(e.message || 'Error updating status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handler for Deliverer completing delivery via 4-Digit Handshake PIN
  const handleVerifyHandshakePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinModalGig) return;

    setPinError('');
    if (!inputPin || inputPin.length !== 4) {
      setPinError('Please enter the 4-digit PIN provided by the customer.');
      return;
    }

    setActionLoadingId(pinModalGig.id);
    try {
      const res = await verifyDeliveryHandshakeCode(pinModalGig.id, inputPin);
      if (res.success) {
        alert('🎉 Handshake PIN Verified! Delivery completed successfully.');
        const currentGig = pinModalGig;
        setPinModalGig(null);
        setInputPin('');
        await fetchData();

        // Prompt deliverer to rate customer
        if (currentGig?.order?.user) {
          setRatingConfig({
            gigId: currentGig.id,
            toUserId: currentGig.order.user.id,
            toUserName: currentGig.order.user.name,
            feedbackType: 'deliverer_to_buyer',
          });
        }
      } else {
        setPinError(res.error || 'Invalid PIN');
      }
    } catch (e: any) {
      setPinError(e.message || 'Verification error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handler for Buyer confirming receipt directly from Dashboard
  const handleConfirmReceipt = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await confirmOrderReceipt(orderId);
      if (res.success) {
        await fetchData();
      } else {
        alert(res.error || 'Failed to confirm receipt.');
      }
    } catch (e: any) {
      alert(e.message || 'Error confirming receipt');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handler for Buyer cancelling a pending order
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setActionLoadingId(orderId);
    try {
      const res = await cancelOrder(orderId);
      if (res.success) {
        await fetchData();
      } else {
        alert(res.error || 'Failed to cancel order.');
      }
    } catch (e: any) {
      alert(e.message || 'Error cancelling order');
    } finally {
      setActionLoadingId(null);
    }
  };

  const activeOpenGigs = openGigs.filter((g) => !dismissedGigIds.includes(g.id));

  // If nothing active at all, render nothing
  if (myActiveOrders.length === 0 && myAssignedGigs.length === 0 && activeOpenGigs.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-6 animate-fadeIn">
      {/* ── 1. BUYER ACTIVE ORDERS TRACKER ── */}
      {myActiveOrders.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#004CBB] text-[22px] animate-pulse">pending_actions</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary dark:text-[#a4a2a5]">
                Active Food Orders ({myActiveOrders.length})
              </h3>
            </div>
            <Link href="/food" className="text-xs font-bold text-[#004CBB] dark:text-[#8078FF] hover:underline">
              View All in Food Section →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {myActiveOrders.map((order) => {
              const parsedItems = JSON.parse(order.items || '[]') as Array<{ name: string; quantity: number; price: number }>;
              return (
                <div key={order.id} className="base-card p-6 rounded-24 flex flex-col gap-4 bg-gradient-to-br from-surface-container-low to-surface-container-high/30 border border-outline/30 shadow-lg text-primary dark:text-white">
                  {/* Order Top Bar */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#004CBB]/10 text-[#004CBB] dark:text-[#8078FF] border border-[#004CBB]/20">
                          ● {order.status}
                        </span>
                        <span className="text-xs font-mono text-secondary">#{order.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <p className="text-xs text-secondary mt-1">
                        Placed on {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <span className="text-xl font-bold text-primary dark:text-white">₹{order.total.toFixed(2)}</span>
                  </div>

                  {/* Items summary */}
                  <div className="p-3 bg-surface-container-low dark:bg-surface-container-high rounded-xl flex flex-col gap-1.5 text-xs text-primary dark:text-white font-medium">
                    {parsedItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span>{item.quantity}× {item.name}</span>
                        <span className="text-secondary font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Embedded Peer Delivery Tracker if Peer Delivery is active */}
                  {order.deliveryGig && (
                    <PeerDeliveryTracker
                      gigId={order.deliveryGig.id}
                      orderId={order.id}
                      deliveryAddress={order.deliveryAddress}
                      deliveryFee={order.deliveryFee}
                    />
                  )}

                  {/* Quick Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-outline/20">
                    {order.status === 'pending' && (!order.deliveryGig || order.deliveryGig.status === 'open') ? (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={actionLoadingId === order.id}
                        className="px-4 py-2 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 font-bold text-xs transition-all cursor-pointer border border-red-500/30"
                      >
                        {actionLoadingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    ) : (
                      <span className="text-xs text-secondary italic">Live tracking active</span>
                    )}

                    <button
                      onClick={() => handleConfirmReceipt(order.id)}
                      disabled={actionLoadingId === order.id}
                      className="px-5 py-2.5 rounded-full bg-[#004CBB] hover:bg-[#003da1] text-white font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>{actionLoadingId === order.id ? 'Updating...' : 'Got My Food! Confirm Receipt'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 2. DELIVERER ACTIVE GIG CONTROL PANEL ── */}
      {myAssignedGigs.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004CBB] text-[22px] animate-pulse">two_wheeler</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary dark:text-[#a4a2a5]">
              Your Active Delivery Tasks ({myAssignedGigs.length})
            </h3>
          </div>

          {myAssignedGigs.map((gig) => {
            const customer = gig.order?.user;
            const parsedItems = JSON.parse(gig.order?.items || '[]') as Array<{ name: string; quantity: number }>;

            return (
              <div key={gig.id} className="p-6 rounded-24 bg-gradient-to-br from-slate-900 via-[#121214] to-black text-white border border-[#004CBB]/40 shadow-xl flex flex-col gap-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-[#004CBB]/50 shrink-0">
                      <MorphicImage src={customer?.avatarUrl || ''} alt={customer?.name || 'Customer'} fallbackIcon="account_circle" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#004CBB]/20 text-[#8078FF] border border-[#004CBB]/40">
                          ● Task ({gig.status === 'accepted' ? 'Pickup at Canteen' : 'En Route to Buyer'})
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#004CBB]/20 text-[#8078FF]">✓ Verified Buyer</span>
                      </div>
                      <h4 className="font-bold text-base text-white mt-1">Deliver to {customer?.name || 'Student'}</h4>
                      <p className="text-xs text-white/70">Drop-off: {gig.order?.deliveryAddress || 'Campus Hostel'}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-[#8078FF] font-bold uppercase tracking-wider block">Your Cash Tip</span>
                    <span className="text-2xl font-black text-white">₹{gig.order?.deliveryFee || 20}</span>
                  </div>
                </div>

                {/* Items to pick up */}
                <div className="p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-xs flex justify-between items-center text-white/90">
                  <span className="font-semibold">Items: {parsedItems.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</span>
                  <span className="text-[#8078FF] font-bold">Collect: ₹{gig.order?.total?.toFixed(2)} Cash</span>
                </div>

                {/* Customer Contact, Report & Status Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-3 flex-wrap">
                  {/* Contact buyer buttons & Dispute button */}
                  <div className="flex items-center gap-2">
                    {customer?.phoneNumber && (
                      <a
                        href={`tel:${customer.phoneNumber}`}
                        className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">call</span>
                        <span>Call</span>
                      </a>
                    )}
                    {customer?.id && (
                      <Link
                        href={`/messages/${customer.id}`}
                        className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">chat</span>
                        <span>Chat</span>
                      </Link>
                    )}
                    {customer && (
                      <button
                        onClick={() =>
                          setDisputeConfig({
                            orderId: gig.orderId,
                            gigId: gig.id,
                            reportedUserId: customer.id,
                            reportedUserName: customer.name,
                          })
                        }
                        className="px-3 py-1.5 rounded-full bg-red-500/20 text-red-300 font-bold text-xs flex items-center gap-1 transition-all border border-red-500/30"
                      >
                        <span className="material-symbols-outlined text-[14px]">flag</span>
                        <span>Report Issue</span>
                      </button>
                    )}
                  </div>

                  {/* Status Action Buttons */}
                  {gig.status === 'accepted' && (
                    <button
                      onClick={() => handleMarkPickedUp(gig.id)}
                      disabled={actionLoadingId === gig.id}
                      className="px-5 py-2.5 rounded-full bg-[#004CBB] hover:bg-[#003da1] text-white font-black text-xs shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">takeout_dining</span>
                      <span>{actionLoadingId === gig.id ? 'Updating...' : '🍛 Mark Food Picked Up'}</span>
                    </button>
                  )}

                  {gig.status === 'picked_up' && (
                    <button
                      onClick={() => {
                        setPinModalGig(gig);
                        setInputPin('');
                        setPinError('');
                      }}
                      disabled={actionLoadingId === gig.id}
                      className="px-5 py-2.5 rounded-full bg-[#004CBB] hover:bg-[#003da1] text-white font-black text-xs shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">verified_user</span>
                      <span>Enter Handshake PIN & Complete (Earn ₹{gig.order?.deliveryFee || 20})</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 3. OPEN CAMPUS RADAR DELIVERY REQUEST ── */}
      {activeOpenGigs.length > 0 && myAssignedGigs.length === 0 && (
        <div className="p-5 rounded-24 bg-gradient-to-r from-[#004CBB] via-[#3366cc] to-[#8078FF] text-white shadow-xl flex flex-col gap-4 border border-white/20">
          {(() => {
            const currentGig = activeOpenGigs[0];
            const parsedItems = JSON.parse(currentGig.order?.items || '[]') as Array<{ name: string; quantity: number }>;
            const itemTotalCount = parsedItems.reduce((acc, i) => acc + (i.quantity || 1), 0);

            return (
              <>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[24px] animate-pulse text-white">two_wheeler</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full text-white/90">
                        Live Peer Request
                      </span>
                      <h3 className="font-black text-base text-white mt-0.5">
                        Deliver food to {currentGig.order?.deliveryAddress || 'Campus Hostel'}
                      </h3>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider block">Cash Tip</span>
                    <span className="text-xl font-black text-white">₹{currentGig.order?.deliveryFee || 20}</span>
                  </div>
                </div>

                <div className="p-3 bg-black/15 backdrop-blur-sm rounded-xl text-xs flex items-center justify-between text-white/90">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-[16px]">restaurant</span>
                    {itemTotalCount} Food Item(s) from Canteen
                  </span>
                  <span className="text-[11px] opacity-80">Drop-off: {currentGig.order?.deliveryAddress || 'Campus Quad'}</span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-1 border-t border-white/10">
                  <button
                    onClick={() => setDismissedGigIds((prev) => [...prev, currentGig.id])}
                    className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer border border-white/20"
                  >
                    ✕ Pass
                  </button>

                  <button
                    onClick={() => handleAcceptGig(currentGig.id)}
                    disabled={actionLoadingId === currentGig.id}
                    className="px-5 py-2 rounded-full bg-white text-[#004CBB] font-black text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    {actionLoadingId === currentGig.id ? (
                      <span>Claiming...</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>Accept Request (Earn ₹{currentGig.order?.deliveryFee || 20})</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ── HANDSHAKE PIN VERIFICATION MODAL FOR DELIVERER ── */}
      {pinModalGig && (
        <>
          <div onClick={() => setPinModalGig(null)} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fadeIn" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-white dark:bg-[#121214] border border-outline rounded-24 p-6 shadow-2xl animate-scale-up text-primary dark:text-white text-center">
            <div className="w-12 h-12 rounded-full bg-[#004CBB]/10 text-[#004CBB] dark:text-[#8078FF] flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[28px]">lock_person</span>
            </div>

            <h3 className="text-lg font-bold">Delivery Handshake Lock</h3>
            <p className="text-xs text-secondary mt-1 mb-4">
              Ask <strong className="text-primary dark:text-white">{pinModalGig.order?.user?.name || 'Customer'}</strong> for their 4-digit Handshake PIN to confirm receipt & collect ₹{pinModalGig.order?.total?.toFixed(2)} cash.
            </p>

            {pinError && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold">
                {pinError}
              </div>
            )}

            <form onSubmit={handleVerifyHandshakePin} className="flex flex-col gap-4">
              <input
                type="text"
                maxLength={4}
                placeholder="Enter 4-digit PIN"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                className="w-full py-3.5 px-4 text-center font-mono text-3xl font-black tracking-widest rounded-2xl bg-surface-container-low dark:bg-surface-container-high border-2 border-[#004CBB]/50 outline-none focus:ring-4 focus:ring-[#004CBB]/20"
                autoFocus
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPinModalGig(null)}
                  className="flex-1 py-3 rounded-full bg-surface-container-low dark:bg-surface-container-high font-bold text-xs hover:opacity-80 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === pinModalGig.id || inputPin.length !== 4}
                  className="flex-1 py-3 rounded-full bg-[#004CBB] hover:bg-[#003da1] text-white font-bold text-xs shadow-md hover:scale-105 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {actionLoadingId === pinModalGig.id ? 'Verifying...' : 'Verify PIN & Finish 🎉'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Dispute Modal */}
      {disputeConfig && (
        <DisputeModal
          orderId={disputeConfig.orderId}
          gigId={disputeConfig.gigId}
          reportedUserId={disputeConfig.reportedUserId}
          reportedUserName={disputeConfig.reportedUserName}
          onClose={() => setDisputeConfig(null)}
        />
      )}

      {/* Rating Modal */}
      {ratingConfig && (
        <RatingModal
          gigId={ratingConfig.gigId}
          toUserId={ratingConfig.toUserId}
          toUserName={ratingConfig.toUserName}
          feedbackType={ratingConfig.feedbackType}
          onClose={() => setRatingConfig(null)}
        />
      )}
    </section>
  );
}
