'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionBanner from './SubscriptionBanner';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requireActive?: boolean;
}

export default function SubscriptionGuard({
  children,
  requireActive = true,
}: SubscriptionGuardProps) {
  const router = useRouter();
  const { subscription, loading } = useSubscription();

  useEffect(() => {
    if (!loading && requireActive && !subscription?.is_active) {
      router.push('/subscribe');
    }
  }, [loading, subscription, requireActive, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (requireActive && !subscription?.is_active) {
    return null;
  }

  return (
    <>
      <SubscriptionBanner />
      {children}
    </>
  );
}