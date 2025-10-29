'use client';

import { useSubscription } from '@/hooks/useSubscription';
import { shouldShowWarning } from '@/lib/subscription';
import { useState } from 'react';
import SubscriptionModal from './SubscriptionModal';

export default function SubscriptionBanner() {
  const { subscription, loading, refetch } = useSubscription();
  const [showModal, setShowModal] = useState(false);

  if (loading || !subscription) return null;

  const warning = shouldShowWarning(subscription.days_remaining);

  if (!warning.show && subscription.is_active) return null;

  // Expired - block access
  if (!subscription.is_active) {
    return (
      <>
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Subscription Expired</h2>
              <p className="text-gray-600 mb-6">
                Your subscription has expired. Renew now to continue accessing the platform.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Renew Subscription - $3/month
              </button>
            </div>
          </div>
        </div>

        <SubscriptionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={refetch}
        />
      </>
    );
  }

  // Warning banner
  const colors = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-orange-50 border-orange-200 text-orange-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <>
      <div className={`border-b ${colors[warning.severity]} px-4 py-3`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{warning.message}</span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-1.5 bg-white rounded-md text-sm font-medium hover:bg-gray-50"
          >
            Renew Now
          </button>
        </div>
      </div>

      <SubscriptionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={refetch}
      />
    </>
  );
}