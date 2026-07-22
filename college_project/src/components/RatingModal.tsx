'use client';

import React, { useState } from 'react';
import { submitDeliveryReview } from '@/app/actions/delivery';

interface RatingModalProps {
  gigId: string;
  toUserId: string;
  toUserName: string;
  feedbackType: 'buyer_to_deliverer' | 'deliverer_to_buyer';
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RatingModal({
  gigId,
  toUserId,
  toUserName,
  feedbackType,
  onClose,
  onSuccess,
}: RatingModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await submitDeliveryReview(gigId, toUserId, rating, feedbackType, comment);
      if (res.success) {
        alert('⭐ Thank you for rating! Your review helps build a safer campus community.');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.error || 'Failed to submit review.');
      }
    } catch (err: any) {
      setError(err.message || 'Error submitting review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fadeIn" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-white dark:bg-[#121214] border border-outline rounded-24 p-6 shadow-2xl animate-scale-up text-primary dark:text-white text-center">
        <h3 className="text-lg font-bold">
          Rate {feedbackType === 'buyer_to_deliverer' ? 'Delivery Partner' : 'Customer'}
        </h3>
        <p className="text-xs text-secondary mt-1 mb-4">
          How was your experience with <strong className="text-primary dark:text-white">{toUserName}</strong>?
        </p>

        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Star selector */}
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 cursor-pointer transition-transform hover:scale-125 active:scale-95"
              >
                <span
                  className={`material-symbols-outlined text-[32px] ${
                    star <= rating ? 'text-amber-500' : 'text-outline'
                  }`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
              </button>
            ))}
          </div>

          <textarea
            rows={2}
            placeholder="Add optional feedback (e.g. fast drop-off, polite, paid promptly)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3 rounded-xl bg-surface-container-low dark:bg-surface-container-high border border-outline text-xs font-medium outline-none resize-none"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full bg-surface-container-low dark:bg-surface-container-high font-bold text-xs hover:opacity-80 transition-all cursor-pointer"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-full bg-primary dark:bg-white text-white dark:text-black font-bold text-xs shadow-md hover:scale-105 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Submitting...' : 'Submit Rating ⭐'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
