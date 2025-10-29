import { createServerClient } from '@/lib/supabase/server';

export async function checkApiSubscription() {
  const supabase = await createServerClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return {
      authorized: false,
      error: 'Unauthorized',
      user: null,
    };
  }

  const { data, error } = await supabase.rpc('check_subscription_status', {
    p_user_id: user.id,
  });

  if (error) {
    console.error('Subscription check error:', error);
    return {
      authorized: false,
      error: 'Failed to check subscription',
      user,
    };
  }

  const subscriptionStatus = data as {
    is_active: boolean;
    status: string;
    expires_at: string | null;
    days_remaining: number;
  };

  if (!subscriptionStatus.is_active) {
    return {
      authorized: false,
      error: 'Subscription required',
      user,
      subscription: subscriptionStatus,
    };
  }

  return {
    authorized: true,
    user,
    subscription: subscriptionStatus,
  };
}