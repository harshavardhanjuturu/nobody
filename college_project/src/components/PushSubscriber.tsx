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
        setMessage('Notification permission denied. Enable it in browser settings.');
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
    <div className="flex justify-between items-center text-sm font-medium">
      <div>
        <p className="text-primary dark:text-white">Push Notifications</p>
        <p className="text-xs text-secondary mt-0.5 font-normal">
          {state === 'subscribed'
            ? 'Enabled — you\'ll get alerts for orders and events.'
            : 'Get alerts for food orders, event RSVPs, and messages.'}
        </p>
        {message && (
          <p className={`text-xs mt-1 font-medium ${state === 'error' ? 'text-error' : 'text-green-600 dark:text-green-400'}`}>
            {message}
          </p>
        )}
      </div>

      <button
        onClick={state === 'subscribed' ? undefined : subscribe}
        disabled={state === 'subscribing' || state === 'subscribed'}
        className={`px-5 py-2 rounded-full text-xs font-semibold hover:scale-105 active:scale-95 transition-all whitespace-nowrap ${
          state === 'subscribed'
            ? 'bg-green-600 text-white dark:bg-green-500 cursor-default'
            : state === 'subscribing'
            ? 'bg-surface-container-low dark:bg-surface-container-high text-secondary cursor-wait'
            : 'bg-surface-container-low dark:bg-surface-container-high text-primary dark:text-white cursor-pointer'
        }`}
      >
        {state === 'subscribed' ? '✓ Enabled' : state === 'subscribing' ? 'Enabling...' : 'Enable'}
      </button>
    </div>
  );
}
