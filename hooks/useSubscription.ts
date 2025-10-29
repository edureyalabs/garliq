'use client';

import { useEffect, useState } from 'react';
import { checkSubscription, SubscriptionStatus } from '@/lib/subscription';
import { useRouter } from 'next/navigation';

export function useSubscription(redirectIfInactive = false) {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const status = await checkSubscription();
        setSubscription(status);
        
        if (redirectIfInactive && !status.is_active) {
          router.push('/subscribe');
        }
      } catch (error) {
        console.error('Fetch subscription error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [redirectIfInactive, router]);

  const refetch = async () => {
    setLoading(true);
    const status = await checkSubscription();
    setSubscription(status);
    setLoading(false);
  };

  return {
    subscription,
    loading,
    refetch,
    isActive: subscription?.is_active ?? false,
    daysRemaining: subscription?.days_remaining ?? 0,
  };
}