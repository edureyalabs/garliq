import { createClient } from '@/lib/supabase/client';

export interface SubscriptionStatus {
  is_active: boolean;
  status: 'none' | 'active' | 'expired' | 'cancelled' | 'trial';
  expires_at: string | null;
  days_remaining: number;
}

export async function checkSubscription(): Promise<SubscriptionStatus> {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        is_active: false,
        status: 'none',
        expires_at: null,
        days_remaining: 0,
      };
    }

    const { data, error } = await supabase.rpc('check_subscription_status', {
      p_user_id: user.id,
    });

    if (error) throw error;

    return data as SubscriptionStatus;
  } catch (error) {
    console.error('Check subscription error:', error);
    return {
      is_active: false,
      status: 'none',
      expires_at: null,
      days_remaining: 0,
    };
  }
}

export function shouldShowWarning(daysRemaining: number): {
  show: boolean;
  severity: 'info' | 'warning' | 'error';
  message: string;
} {
  if (daysRemaining <= 0) {
    return {
      show: true,
      severity: 'error',
      message: 'Your subscription has expired',
    };
  }
  
  if (daysRemaining === 1) {
    return {
      show: true,
      severity: 'error',
      message: 'Your subscription expires tomorrow',
    };
  }
  
  if (daysRemaining <= 3) {
    return {
      show: true,
      severity: 'warning',
      message: `Your subscription expires in ${daysRemaining} days`,
    };
  }
  
  if (daysRemaining <= 7) {
    return {
      show: true,
      severity: 'info',
      message: `Your subscription expires in ${daysRemaining} days`,
    };
  }
  
  return {
    show: false,
    severity: 'info',
    message: '',
  };
}