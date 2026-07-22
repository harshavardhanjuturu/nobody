'use client';

import React, { useState, useEffect } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type PushState = 'unsupported' | 'not-subscribed' | 'subscribing' | 'subscribed' | 'error';

export default function PushSubscriber() {
  const [state, setState] = useState<PushState>('not-subscribed');
  const [message, setMessage] = useState('');
  const [showSettingsHelp, setShowSettingsHelp] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) setState('subscribed');
      });
    });
  }, []);

  const subscribe = async () => {
    setState('subscribing');
    setMessage('');
    try {
      // Register service worker
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('not-subscribed');
        setMessage('Permission blocked in browser. Tap to view 2-step setup guide.');
        setShowSettingsHelp(true);
        return;
      }

      // Subscribe to push
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
      });

      const subJson = subscription.toJSON();

      // Save to server
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      });

      if (res.ok) {
        setState('subscribed');
        setMessage('You\'ll now receive order and event alerts!');
      } else {
        throw new Error('Failed to save subscription.');
      }
    } catch (err: any) {
      console.error('[PushSubscriber]', err);
      setState('error');
      setMessage(err.message || 'Something went wrong.');
    }
  };

  if (state === 'unsupported') return null;

  return (
    <>
      <div className="flex justify-between items-center text-sm font-medium">
        <div>
          <p className="text-primary dark:text-white">Push Notifications</p>
          <p className="text-xs text-secondary mt-0.5 font-normal">
            {state === 'subscribed'
              ? 'Enabled — you\'ll get alerts for orders and events.'
              : 'Get alerts for food orders, event RSVPs, and messages.'}
          </p>
          {message && (
            <p
              onClick={() => setShowSettingsHelp(true)}
              className={`text-xs mt-1 font-semibold cursor-pointer underline ${state === 'error' ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}
            >
              {message}
            </p>
          )}
        </div>

        <button
          onClick={state === 'subscribed' ? undefined : subscribe}
          disabled={state === 'subscribing' || state === 'subscribed'}
          className={`px-5 py-2 rounded-full text-xs font-semibold hover:scale-105 active:scale-95 transition-all whitespace-nowrap ${
            state === 'subscribed'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 cursor-default'
              : state === 'subscribing'
              ? 'bg-surface-container-low dark:bg-surface-container-high text-secondary cursor-wait'
              : 'bg-surface-container-low dark:bg-surface-container-high text-primary dark:text-white cursor-pointer'
          }`}
        >
          {state === 'subscribed' ? 'Enabled' : state === 'subscribing' ? 'Enabling...' : 'Enable'}
        </button>
      </div>

      {/* ===================== MOBILE SETTINGS HELP MODAL ===================== */}
      {showSettingsHelp && (
        <>
          <div onClick={() => setShowSettingsHelp(false)} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-white/10 rounded-24 p-6 shadow-2xl flex flex-col gap-4 text-slate-900 dark:text-white">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-white/10">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">notifications_off</span>
                Unblock Notifications
              </h3>
              <button onClick={() => setShowSettingsHelp(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your browser blocked push notifications for this URL. Follow these 2 steps to unblock:
            </p>

            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3 rounded-16 bg-slate-100 dark:bg-white/5 flex flex-col gap-1">
                <span className="font-bold text-slate-900 dark:text-white">Android (Chrome):</span>
                <span className="text-slate-600 dark:text-slate-300">
                  1. Tap the <strong>Lock icon</strong> in the browser address bar.<br />
                  2. Tap <strong>Permissions</strong> → <strong>Notifications</strong> → Select <strong>Allow</strong>.
                </span>
              </div>

              <div className="p-3 rounded-16 bg-slate-100 dark:bg-white/5 flex flex-col gap-1">
                <span className="font-bold text-slate-900 dark:text-white">iPhone (iOS Safari):</span>
                <span className="text-slate-600 dark:text-slate-300">
                  1. Open iPhone <strong>Settings</strong> → <strong>Safari</strong> → <strong>Notifications</strong> → Select <strong>Allow</strong>.<br />
                  2. Or tap Share → <strong>Add to Home Screen</strong> to enable native iOS web alerts.
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center font-medium">
              Note: In-app alerts and email notifications are active by default!
            </p>

            <button
              onClick={() => setShowSettingsHelp(false)}
              className="w-full py-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-xs shadow-md cursor-pointer"
            >
              Got it
            </button>
          </div>
        </>
      )}
    </>
  );
}
