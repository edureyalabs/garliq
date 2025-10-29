import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

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

    // Validate Razorpay credentials
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Missing Razorpay credentials');
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      );
    }

    // ✅ Initialize Razorpay INSIDE the function
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // ✅ Create a shorter receipt (max 40 chars)
    // Format: sub_TIMESTAMP (e.g., "sub_1234567890123")
    const receipt = `sub_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount: 300, // $3.00 in cents
      currency: 'USD',
      receipt: receipt,
      notes: {
        user_id: user.id,
        type: 'subscription',
      },
    });

    const { error: dbError } = await supabase
      .from('subscription_payments')
      .insert({
        user_id: user.id,
        razorpay_order_id: order.id,
        amount: 3.00,
        currency: 'USD',
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