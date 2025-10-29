import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment details' },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('RAZORPAY_KEY_SECRET not configured');
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      );
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('Payment signature mismatch', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Update payment record
    const { data: updateData, error: updateError } = await supabase
      .from('subscription_payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'completed',
        paid_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .select();

    if (updateError) {
      console.error('Payment update failed', {
        error: updateError,
        orderId: razorpay_order_id,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to update payment' },
        { status: 500 }
      );
    }

    if (!updateData || updateData.length === 0) {
      console.error('Payment record not found', {
        orderId: razorpay_order_id,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Activate subscription
    const { data, error: activateError } = await supabase.rpc(
      'activate_subscription',
      {
        p_user_id: user.id,
        p_duration_days: 30,
        p_razorpay_payment_id: razorpay_payment_id,
        p_amount: 3.00,
      }
    );

    if (activateError) {
      console.error('Subscription activation failed', {
        error: activateError,
        userId: user.id,
        paymentId: razorpay_payment_id,
      });
      return NextResponse.json(
        { error: 'Failed to activate subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Payment verification error', {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}