'use client';
import { motion } from 'framer-motion';
import { Crown, Clock } from 'lucide-react';
import { SubscriptionStatus } from './types';

interface SubscriptionPanelProps {
  subscriptionStatus: SubscriptionStatus | null;
  onSubscribe: () => void;
}

export default function SubscriptionPanel({ subscriptionStatus, onSubscribe }: SubscriptionPanelProps) {
  if (!subscriptionStatus) return null;

  const getSubscriptionBadge = () => {
    const colors = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      trial: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      expired: 'bg-red-500/20 text-red-400 border-red-500/30',
      cancelled: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      none: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };

    const labels = {
      active: '✓ Active',
      trial: '⚡ Trial',
      expired: '✗ Expired',
      cancelled: '⊘ Cancelled',
      none: '○ None',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[subscriptionStatus.status as keyof typeof colors]}`}>
        {labels[subscriptionStatus.status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Crown size={24} className="text-purple-400" />
            <span className="font-bold text-lg">Subscription</span>
          </div>
          {getSubscriptionBadge()}
        </div>

        <div className="space-y-4 text-sm mb-6">
          {subscriptionStatus.expires_at && (
            <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400 flex items-center gap-2">
                <Clock size={16} />
                {subscriptionStatus.is_active ? 'Expires' : 'Expired'}:
              </span>
              <span className="font-medium">
                {new Date(subscriptionStatus.expires_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}

          {subscriptionStatus.is_active && (
            <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">Days Remaining:</span>
              <span className={`font-bold text-lg ${
                subscriptionStatus.days_remaining <= 3 ? 'text-red-400' :
                subscriptionStatus.days_remaining <= 7 ? 'text-orange-400' :
                'text-green-400'
              }`}>
                {subscriptionStatus.days_remaining}
              </span>
            </div>
          )}
        </div>

        {!subscriptionStatus.is_active ? (
          <motion.button
            onClick={onSubscribe}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold flex items-center justify-center gap-2 text-sm shadow-lg"
          >
            <Crown size={18} />
            Renew Subscription - $3/mo
          </motion.button>
        ) : subscriptionStatus.days_remaining <= 7 && (
          <motion.button
            onClick={onSubscribe}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-4 py-3 border border-purple-600 text-purple-400 rounded-xl hover:bg-purple-600/10 font-semibold flex items-center justify-center gap-2 text-sm"
          >
            <Crown size={18} />
            Extend Subscription
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}