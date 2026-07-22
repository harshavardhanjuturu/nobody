'use client';

import React, { useState } from 'react';
import { createDisputeReport } from '@/app/actions/delivery';

interface DisputeModalProps {
  orderId: string;
  gigId?: string | null;
  reportedUserId: string;
  reportedUserName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DisputeModal({
  orderId,
  gigId = null,
  reportedUserId,
  reportedUserName,
  onClose,
  onSuccess,
}: DisputeModalProps) {
  const [reason, setReason] = useState<string>('never_delivered');
  const [details, setDetails] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!details.trim()) {
      setError('Please describe what happened in detail.');
      return;
    }

    setLoading(true);
    try {
      const res = await createDisputeReport(orderId, gigId, reportedUserId, reason, details);
      if (res.success) {
        alert('Report Sent directly to Admin Email! Our Trust & Safety team will review the issue and contact you.');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.error || 'Failed to submit report.');
      }
    } catch (err: any) {
      setError(err.message || 'Error submitting report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fadeIn" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-surface border border-outline rounded-24 p-6 shadow-2xl animate-scale-up text-primary dark:text-white">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2 text-primary dark:text-white font-bold">
            <span className="material-symbols-outlined text-[24px]">shield</span>
            <h3 className="text-lg">File Trust & Safety Report</h3>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-primary dark:hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <p className="text-xs text-secondary mb-4 leading-relaxed">
          Report an issue regarding <strong className="text-primary dark:text-white">{reportedUserName}</strong>. This report will be sent directly to the Admin via email for immediate review and decision making.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-secondary">Reason for Report</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high border border-outline text-xs font-semibold outline-none"
            >
              <option value="never_delivered">Food Never Delivered / Deliverer Absent</option>
              <option value="refused_payment">Customer Refused Payment / Fake Handshake</option>
              <option value="damaged_food">Food Damaged / Incomplete Order</option>
              <option value="unresponsive">Unresponsive / Rude Conduct</option>
              <option value="other">Other Incident</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-secondary">Incident Details</label>
            <textarea
              rows={3}
              placeholder="Provide exact details of what occurred (e.g. deliverer took food and walked away, or buyer refused cash payment)..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full p-3 rounded-xl bg-surface-container-low dark:bg-surface-container-high border border-outline text-xs font-medium outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full bg-surface-container-low dark:bg-surface-container-high font-bold text-xs hover:opacity-80 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-full bg-primary dark:bg-white text-white dark:text-black font-bold text-xs shadow-md hover:scale-105 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Sending to Admin...' : 'Send to Admin Email'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
