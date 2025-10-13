import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyRazorpaySignature, fetchPaymentDetails } from '@/lib/razorpay';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/payments/verify
 * Verifies payment from frontend after Razorpay checkout completes
 * 
 * Body:
 * {
 *   "razorpay_order_id": "order_xxx",
 *   "razorpay_payment_id": "pay_xxx",
 *   "razorpay_signature": "signature_xxx",
 *   "userId": "uuid"
 * }
 */
export async function POST(request: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
    } = await request.json();

    console.log('🔍 Verifying payment:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      userId,
    });

    // Validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Step 1: Verify signature (CRITICAL - prevents fake payments)
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      console.error('❌ Invalid Razorpay signature');
      return NextResponse.json(
        { error: 'Payment verification failed - invalid signature' },
        { status: 400 }
      );
    }

    console.log('✅ Signature verified');

    // Step 2: Check if order exists and belongs to this user
    const { data: existingOrder, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', userId)
      .single();

    if (orderError || !existingOrder) {
      console.error('Order not found:', orderError);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Step 3: Check if already processed
    if (existingOrder.status === 'completed') {
      console.log('ℹ️ Order already completed');
      return NextResponse.json({
        success: true,
        status: 'already_completed',
        tokens: existingOrder.token_amount,
      });
    }

    // Step 4: Fetch payment details from Razorpay for extra verification
    const paymentDetailsResult = await fetchPaymentDetails(razorpay_payment_id);
    
    if (!paymentDetailsResult.success) {
      console.error('Failed to fetch payment details');
      return NextResponse.json(
        { error: 'Failed to verify payment with Razorpay' },
        { status: 500 }
      );
    }

    const paymentDetails = paymentDetailsResult.payment;

    // Check if payment details exist
    if (!paymentDetails) {
      return NextResponse.json(
        { error: 'Could not fetch payment details' },
        { status: 500 }
      );
    }

    // Verify payment status is captured
    if (paymentDetails.status !== 'captured') {
      console.error('Payment not captured:', paymentDetails.status);
      return NextResponse.json(
        { error: `Payment status is ${paymentDetails.status}, not captured` },
        { status: 400 }
      );
    }

    console.log('✅ Payment verified from Razorpay API');

    // Step 5: Complete the payment order (add tokens)
    const { data, error: completeError } = await supabase.rpc('complete_payment_order', {
      p_razorpay_order_id: razorpay_order_id,
      p_razorpay_payment_id: razorpay_payment_id,
      p_razorpay_signature: razorpay_signature,
      p_payment_method: paymentDetails.method,
      p_metadata: paymentDetails,
    });

    if (completeError) {
      // Check if already processed by webhook
      if (completeError.message?.includes('already processed')) {
        console.log('ℹ️ Order already completed by webhook');
        
        // Get updated order info
        const { data: updatedOrder } = await supabase
          .from('payment_orders')
          .select('token_amount')
          .eq('razorpay_order_id', razorpay_order_id)
          .single();

        return NextResponse.json({
          success: true,
          status: 'already_completed',
          tokens: updatedOrder?.token_amount || existingOrder.token_amount,
        });
      }

      console.error('Failed to complete payment:', completeError);
      return NextResponse.json(
        { error: 'Failed to complete payment' },
        { status: 500 }
      );
    }

    console.log('✅ Payment completed successfully, tokens credited');

    // Step 6: Get updated user wallet balance
    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('token_balance')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({
      success: true,
      status: 'completed',
      tokens: existingOrder.token_amount,
      newBalance: wallet?.token_balance || 0,
    });

  } catch (error: any) {
    console.error('❌ Verify payment error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Payment verification failed',
        success: false 
      },
      { status: 500 }
    );
  }
}