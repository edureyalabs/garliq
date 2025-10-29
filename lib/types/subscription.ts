export type SubscriptionStatusType = 'none' | 'active' | 'expired' | 'cancelled' | 'trial';

export interface Subscription {
  id: string;
  user_id: string;
  status: SubscriptionStatusType;
  current_period_start: string | null;
  current_period_end: string | null;
  razorpay_subscription_id: string | null;
  razorpay_payment_id: string | null;
  amount_paid: number;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  trial_ends_at: string | null;
}

export interface SubscriptionPayment {
  id: string;
  user_id: string;
  subscription_id: string | null;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paid_at: string | null;
  created_at: string;
  metadata: Record<string, any> | null;
}