'use client';

import { useSubscription } from '@/hooks/useSubscription';
import { useState } from 'react';
import SubscriptionModal from './SubscriptionModal';

export default function SubscriptionStatus() {
  const { subscription, loading, refetch } = useSubscription();
  const [showModal, setShowModal] = useState(false);

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
    );
  }

  if (!subscription) return null;

  const getStatusColor = () => {
    if (!subscription.is_active) return 'bg-red-100 text-red-800';
    if (subscription.days_remaining <= 3) return 'bg-orange-100 text-orange-800';
    if (subscription.status === 'trial') return 'bg-purple-100 text-purple-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = () => {
    if (!subscription.is_active) {
      return 'Expired';
    }
    
    if (subscription.status === 'trial') {
      return `Trial: ${subscription.days_remaining}d left`;
    }
    
    if (subscription.expires_at) {
      const date = new Date(subscription.expires_at);
      return `Active until ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    
    return 'Active';
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </div>
        
        {!subscription.is_active && (
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full hover:bg-blue-700"
          >
            Renew
          </button>
        )}
      </div>

      <SubscriptionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={refetch}
      />
    </>
  );
}