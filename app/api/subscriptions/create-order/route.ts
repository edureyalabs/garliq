import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createRazorpayOrder } from '@/lib/razorpay';
import { detectCountry } from '@/lib/geo';

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

    // Detect user's country from IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = (forwardedFor?.split(',')[0] || realIp || 'unknown').trim();
    
    const country = await detectCountry(ip);
    const currency = country === 'IN' ? 'INR' : 'USD';

    console.log('💳 Creating subscription order:', { userId: user.id, country, currency });

    // Use the razorpay utility function
    const razorpayResult = await createRazorpayOrder(
      3.00, // $3 subscription
      user.id,
      0, // Not needed for subscription, just pass 0
      currency
    );

    if (!razorpayResult.success || !razorpayResult.order) {
      console.error('Razorpay order creation failed:', razorpayResult.error);
      return NextResponse.json(
        { error: razorpayResult.error || 'Failed to create payment order' },
        { status: 500 }
      );
    }

    const order = razorpayResult.order;

    const { error: dbError } = await supabase
      .from('subscription_payments')
      .insert({
        user_id: user.id,
        razorpay_order_id: order.id,
        amount: 3.00,
        status: 'pending',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create order record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}