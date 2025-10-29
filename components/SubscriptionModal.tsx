'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  onSuccess,
}: SubscriptionModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscriptions/create-order', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const { orderId, amount, currency, key } = await response.json();

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key,
          amount,
          currency,
          name: 'Your App Name',
          description: 'Monthly Subscription',
          order_id: orderId,
          handler: async (response: any) => {
            try {
              const verifyResponse = await fetch('/api/subscriptions/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              if (!verifyResponse.ok) {
                throw new Error('Payment verification failed');
              }

              onSuccess?.();
              onClose();
              router.refresh();
            } catch (err) {
              setError('Payment verification failed. Please contact support.');
            }
          },
          prefill: {
            name: '',
            email: '',
          },
          theme: {
            color: '#3B82F6',
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
            },
          },
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
        setLoading(false);
      };
    } catch (err) {
      console.error('Subscribe error:', err);
      setError('Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 text-gray-100 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-white">
          Subscribe to Continue
        </h2>

        <div className="mb-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold text-white">Monthly Plan</span>
              <span className="text-2xl font-bold text-blue-400">$3</span>
            </div>
            <p className="text-sm text-gray-400">per month</p>
          </div>

          <div className="space-y-2 mb-4">
            <h3 className="font-semibold text-white">What's included:</h3>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>✓ Access to all posts and feed</li>
              <li>✓ Create and publish content</li>
              <li>✓ Studio access</li>
              <li>✓ Community features</li>
            </ul>
          </div>

          <p className="text-xs text-gray-500">
            Note: Tokens are still required for AI generations and are purchased separately.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubscribe}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Subscribe Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
